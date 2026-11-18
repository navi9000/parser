import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { exhaustMap, filter, Observable, take, timer } from 'rxjs';
import type { EntityRecord } from '../entities/entities.service.js';
import { db } from '../prisma/db.js';
import { MAX_SCRAPE_ATTEMPTS, SCRAPING_QUEUE_NAME } from './scraping.constants.js';
import {
  getLatestSavedTimestamp,
  selectNewReviews,
  updateReviewStats,
} from './scraping.utils.js';
import { YandexService } from '../yandex/yandex.service.js';

export interface ScrapeJobData {
  entityId: number;
}

export interface ScrapeJobResult {
  entityId: number;
}

export type ScrapeJobEvent =
  | { status: 'completed'; entityId: number }
  | { status: 'failed'; message: string };

const SCRAPE_FAILURE_MESSAGE =
  `Yandex did not return review data after ${MAX_SCRAPE_ATTEMPTS} attempts. ` +
  'It may be temporarily blocking requests; please try again later.';

@Injectable()
export class ScrapingService {
  constructor(
    @InjectQueue(SCRAPING_QUEUE_NAME)
    private readonly queue: Queue<ScrapeJobData, ScrapeJobResult>,
    private readonly yandexService: YandexService,
  ) {}

  async requestRefresh(entityId: number): Promise<{ jobId: string }> {
    const job = await this.queue.add(
      'refresh-office',
      { entityId },
      { deduplication: { id: `entity-${entityId}` } },
    );
    if (!job.id) {
      throw new Error('BullMQ did not assign an ID to the scrape job');
    }

    return { jobId: job.id };
  }

  watchJob(jobId: string): Observable<ScrapeJobEvent> {
    return timer(0, 1000).pipe(
      exhaustMap(() => this.getTerminalJobEvent(jobId)),
      filter((event): event is ScrapeJobEvent => event !== null),
      take(1),
    );
  }

  async processScrape(entityId: number): Promise<ScrapeJobResult> {
    await this.refreshEntity(entityId);
    return { entityId };
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
      return { status, message: SCRAPE_FAILURE_MESSAGE };
    }
    return null;
  }

  private async refreshEntity(entityId: number): Promise<EntityRecord> {
    const entity = await db.orm.public.Entity.first({ id: entityId });
    if (!entity) {
      throw new NotFoundException(`Entity ${entityId} not found`);
    }

    const scraped = await this.yandexService.parsePage({
      slug: entity.slug,
      office_id: entity.office_id,
    });

    return db.transaction(async (tx) => {
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

      const updatedEntity = await tx.orm.public.Entity.where({
        id: entity.id,
      }).update({
        name: scraped.name,
        review_count: stats.review_count,
        avg_rating: stats.avg_rating,
        last_updated_at: new Date().toISOString(),
      });
      if (!updatedEntity) {
        throw new NotFoundException(`Entity ${entity.id} not found`);
      }

      return updatedEntity;
    });
  }
}
