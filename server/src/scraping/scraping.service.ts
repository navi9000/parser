import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';
import { Observable, type Observer } from 'rxjs';
import { db } from '../prisma/db.js';
import {
  REFRESH_INTERVAL_MS,
  getRefreshDelay,
  getLatestSavedTimestamp,
  selectNewReviews,
  updateReviewStats,
} from './scraping.utils.js';
import { SCRAPING_QUEUE_NAME } from './scraping.constants.js';
import { YandexService } from '../yandex/yandex.service.js';

export interface ScrapeJobData {
  entityId: number;
}

export interface ScrapeJobResult {
  entityId: number;
}

export type ScrapeJobEvent =
  | { status: 'completed'; entityId: number }
  | { status: 'failed'; failedReason: string | null };

@Injectable()
export class ScrapingService implements OnModuleInit {
  private readonly jobObservers = new Map<
    string,
    Set<Observer<ScrapeJobEvent>>
  >();

  constructor(
    @InjectQueue(SCRAPING_QUEUE_NAME)
    private readonly queue: Queue<ScrapeJobData, ScrapeJobResult>,
    private readonly yandexService: YandexService,
  ) {}

  async onModuleInit() {
    await this.queue.waitUntilReady();
    await this.restoreRefreshJobs();
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

  watchJob(jobId: string): Observable<ScrapeJobEvent> {
    return new Observable((observer) => {
      const observers = this.jobObservers.get(jobId) ?? new Set();
      observers.add(observer);
      this.jobObservers.set(jobId, observers);

      void this.getTerminalJobEvent(jobId)
        .then((event) => {
          if (event) {
            this.publishJobEvent(jobId, event);
          }
        })
        .catch((error: unknown) => this.failJobObservers(jobId, error));

      return () => {
        const currentObservers = this.jobObservers.get(jobId);
        currentObservers?.delete(observer);
        if (currentObservers?.size === 0) {
          this.jobObservers.delete(jobId);
        }
      };
    });
  }

  async publishTerminalJobEvent(jobId: string, status: 'completed' | 'failed') {
    if (!this.jobObservers.has(jobId)) {
      return;
    }

    try {
      const event = await this.getTerminalJobEvent(jobId);
      if (event?.status === status) {
        this.publishJobEvent(jobId, event);
      }
    } catch (error) {
      this.failJobObservers(jobId, error);
    }
  }

  handleQueueEventsError(error: Error) {
    this.failAllJobObservers(error);
  }

  private async getTerminalJobEvent(
    jobId: string,
  ): Promise<ScrapeJobEvent | null> {
    const job = await this.queue.getJob(jobId);
    if (!job) {
      throw new NotFoundException('Scrape job not found');
    }

    const status = await job.getState();
    if (status === 'completed') {
      return { status, entityId: job.data.entityId };
    }
    if (status === 'failed') {
      return { status, failedReason: job.failedReason || null };
    }
    return null;
  }

  private publishJobEvent(jobId: string, event: ScrapeJobEvent) {
    const observers = this.jobObservers.get(jobId);
    if (!observers) {
      return;
    }

    this.jobObservers.delete(jobId);
    for (const observer of observers) {
      observer.next(event);
      observer.complete();
    }
  }

  private failJobObservers(jobId: string, error: unknown) {
    const observers = this.jobObservers.get(jobId);
    if (!observers) {
      return;
    }

    this.jobObservers.delete(jobId);
    for (const observer of observers) {
      observer.error(error);
    }
  }

  private failAllJobObservers(error: unknown) {
    for (const jobId of this.jobObservers.keys()) {
      this.failJobObservers(jobId, error);
    }
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

  async scheduleNextRefresh(entityId: number) {
    await this.enqueueRefresh(entityId, REFRESH_INTERVAL_MS, false);
  }

  async processScrape(
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
