import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Job, Queue, Worker } from 'bullmq';
import { randomUUID } from 'node:crypto';
import { db } from '../prisma/db.js';
import {
  REFRESH_INTERVAL_MS,
  getRefreshDelay,
  getLatestSavedTimestamp,
  selectNewReviews,
  updateReviewStats,
} from './scraping.utils.js';
import { YandexService } from '../yandex/yandex.service.js';

const QUEUE_NAME = 'entity-scrapes';
const MAX_SCRAPE_RETRIES = 3;

interface ScrapeJobData {
  entityId: number;
}

interface ScrapeJobResult {
  entityId: number;
}

@Injectable()
export class ScrapingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ScrapingService.name);
  private queue!: Queue<
    ScrapeJobData,
    ScrapeJobResult,
    string,
    ScrapeJobData,
    ScrapeJobResult,
    string
  >;
  private worker!: Worker<ScrapeJobData, ScrapeJobResult>;

  constructor(private readonly yandexService: YandexService) {}

  async onModuleInit() {
    const connection = this.createRedisOptions();
    this.queue = new Queue<
      ScrapeJobData,
      ScrapeJobResult,
      string,
      ScrapeJobData,
      ScrapeJobResult,
      string
    >(QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: MAX_SCRAPE_RETRIES,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 1000,
        removeOnFail: 1000,
      },
    });
    this.worker = new Worker<ScrapeJobData, ScrapeJobResult>(
      QUEUE_NAME,
      (job) => this.scrapeOffice(job),
      { connection, concurrency: 1 },
    );
    this.worker.on('completed', (job) => {
      void this.scheduleNextRefresh(job.data.entityId).catch((error: unknown) =>
        this.logger.error(
          `Could not schedule the next refresh for entity ${job.data.entityId}`,
          error instanceof Error ? error.stack : String(error),
        ),
      );
    });
    this.worker.on('error', (error: Error) => {
      this.logger.error('Scraping worker error', error.stack);
    });
    this.worker.on('failed', (job, error: Error) => {
      if (job) {
        this.logger.error(
          `Scrape job ${job.id} failed for entity ${job.data.entityId}`,
          error.stack,
        );
      }
    });

    await Promise.all([
      this.queue.waitUntilReady(),
      this.worker.waitUntilReady(),
    ]);
    await this.restoreRefreshJobs();
  }

  async onModuleDestroy() {
    if (this.worker && this.queue) {
      await Promise.all([this.worker.close(), this.queue.close()]);
    }
  }

  async requestRefresh(entityId: number): Promise<{ jobId: string }> {
    return this.enqueueRefresh(entityId, 0, true);
  }

  async getJobStatus(jobId: string) {
    const job = await this.queue.getJob(jobId);
    if (!job) {
      throw new NotFoundException('Scrape job not found');
    }

    return {
      jobId,
      entityId: job.data.entityId,
      status: await job.getState(),
      progress: job.progress,
      failedReason: job.failedReason || null,
    };
  }

  private createRedisOptions(): { url: string; maxRetriesPerRequest: null } {
    const redisUrl = new URL(
      process.env['REDIS_URL'] ?? 'redis://127.0.0.1:6379',
    );
    if (redisUrl.protocol !== 'redis:' && redisUrl.protocol !== 'rediss:') {
      throw new Error('REDIS_URL must use the redis:// or rediss:// protocol');
    }

    return {
      url: redisUrl.toString(),
      maxRetriesPerRequest: null,
    };
  }

  private async restoreRefreshJobs() {
    const entities = await db.orm.public.Entity.select(
      'id',
      'last_updated_at',
    ).all();

    for (const entity of entities) {
      await this.enqueueRefresh(
        entity.id,
        getRefreshDelay(entity.last_updated_at),
        false,
      );
    }
  }

  private async enqueueRefresh(
    entityId: number,
    delay: number,
    expediteExisting: boolean,
  ): Promise<{ jobId: string }> {
    const deduplicationId = `entity-${entityId}`;
    const existingJobId =
      await this.queue.getDeduplicationJobId(deduplicationId);

    if (existingJobId) {
      const existingJob = await this.queue.getJob(existingJobId);
      if (existingJob) {
        if (expediteExisting && (await existingJob.getState()) === 'delayed') {
          await existingJob.changeDelay(0);
        }
        return { jobId: existingJobId };
      }
    }

    const job = await this.queue.add(
      'refresh-office',
      { entityId },
      {
        jobId: `entity-${entityId}-${randomUUID()}`,
        delay,
        deduplication: { id: deduplicationId },
      },
    );
    if (!job.id) {
      throw new Error('BullMQ did not assign an ID to the scrape job');
    }
    return { jobId: job.id };
  }

  private async scheduleNextRefresh(entityId: number) {
    await this.enqueueRefresh(entityId, REFRESH_INTERVAL_MS, false);
  }

  private async scrapeOffice(
    job: Job<ScrapeJobData, ScrapeJobResult>,
  ): Promise<ScrapeJobResult> {
    const entity = await db.orm.public.Entity.first({ id: job.data.entityId });
    if (!entity) {
      throw new NotFoundException(`Entity ${job.data.entityId} not found`);
    }

    const scraped = await this.yandexService.parsePage({
      slug: entity.slug,
      office_id: entity.office_id,
    });
    const lastUpdatedAt = new Date().toISOString();

    await db.transaction(async (tx) => {
      const currentEntity = await tx.orm.public.Entity.first({
        id: entity.id,
      });
      if (!currentEntity) {
        throw new NotFoundException(`Entity ${entity.id} not found`);
      }

      const savedTimestamps = await tx.orm.public.Review.where({
        entity_id: entity.id,
      })
        .select('timestamp')
        .all();
      const latestSavedTimestamp = getLatestSavedTimestamp(
        savedTimestamps.map((review) => review.timestamp),
      );
      const newReviews = selectNewReviews(
        scraped.reviewList,
        latestSavedTimestamp,
      );
      const stats = updateReviewStats(
        currentEntity.review_count,
        currentEntity.avg_rating,
        newReviews.map((review) => review.rating),
      );

      for (const review of newReviews) {
        await tx.orm.public.Review.create({
          entity_id: entity.id,
          author: review.author,
          rating: review.rating,
          text: review.text,
          timestamp: review.timestamp,
        });
      }

      await tx.orm.public.Entity.where({ id: entity.id }).update({
        name: scraped.name,
        review_count: stats.review_count,
        avg_rating: stats.avg_rating,
        last_updated_at: lastUpdatedAt,
      });
    });

    return { entityId: entity.id };
  }
}
