import { Injectable, NotFoundException } from '@nestjs/common';
import type { EntityRecord } from '../entities/entities.service.js';
import { db } from '../prisma/db.js';
import {
  getLatestSavedTimestamp,
  selectNewReviews,
  updateReviewStats,
} from './scraping.utils.js';
import { YandexService } from '../yandex/yandex.service.js';

@Injectable()
export class ScrapingService {
  constructor(private readonly yandexService: YandexService) {}

  async refreshEntity(entityId: number): Promise<EntityRecord> {
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
