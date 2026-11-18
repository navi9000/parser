import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { db } from '../prisma/db.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { EntitiesService } from '../entities/entities.service.js';

@Injectable()
export class ReviewsService {
  constructor(private readonly entitiesService: EntitiesService) {}

  async getCommentsByEntity(id: number) {
    const result = await db.orm.public.Review.where({ entity_id: id })
      .select('id', 'entity_id', 'author', 'rating', 'text', 'timestamp')
      .all();
    return this.orderByTimestamp(result);
  }

  async getCommentsByCompanySlug(slug: string) {
    const offices = await db.orm.public.Entity.where({ slug })
      .select('id')
      .all();
    if (!offices.length) {
      throw new NotFoundException('Company not found');
    }

    const entityIds = offices.map((office) => office.id);
    const result = await db.orm.public.Review.where((review) =>
      review.entity_id.in(entityIds),
    )
      .select('id', 'entity_id', 'author', 'rating', 'text', 'timestamp')
      .all();
    return this.orderByTimestamp(result);
  }

  private orderByTimestamp<T extends { timestamp: string }>(reviews: T[]): T[] {
    return reviews.sort((left, right) => {
      const leftTime = Date.parse(left.timestamp);
      const rightTime = Date.parse(right.timestamp);
      if (Number.isNaN(leftTime) || Number.isNaN(rightTime)) {
        return right.timestamp.localeCompare(left.timestamp);
      }
      return rightTime - leftTime;
    });
  }

  async create(entity_id: number, createReviewDto: CreateReviewDto) {
    try {
      const { author, rating, text, timestamp } = createReviewDto;
      const result = await db.orm.public.Review.create({
        author,
        rating,
        text,
        entity_id,
        timestamp,
      });

      const newRating = result.rating;
      await this.entitiesService.updateStats(entity_id, newRating);
      return { ...result };
    } catch (err) {
      if (
        err &&
        typeof err === 'object' &&
        'constraint' in err &&
        err.constraint === 'review_entity_id_fkey'
      ) {
        throw new NotFoundException('Entity not found');
      }
      throw new InternalServerErrorException(err);
    }
  }
}
