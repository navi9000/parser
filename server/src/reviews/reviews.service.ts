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
      .select('id', 'author', 'rating', 'text')
      .all();
    if (!result.length) {
      throw new NotFoundException();
    }

    return result;
  }

  async create(entity_id: number, createReviewDto: CreateReviewDto) {
    try {
      const { author, rating, text } = createReviewDto;
      const result = await db.orm.public.Review.create({
        author,
        rating,
        text,
        entity_id,
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
