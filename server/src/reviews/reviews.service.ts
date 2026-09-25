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

  async create(createReviewDto: CreateReviewDto) {
    try {
      const { entity_id, author, rating, text } = createReviewDto;
      const plan = db.sql.public.review
        .insert([{ entity_id, author, rating, text }])
        .returning('id', 'entity_id', 'author', 'rating', 'text')
        .build();

      const result = (await db.runtime().query(plan))[0];
      const newRating = result.rating;
      await this.entitiesService.updateStats(entity_id.toString(), newRating);

      return result;
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

  async getCommentsByEntity(id: string) {
    const entityId = +id;
    if (isNaN(entityId)) {
      throw new NotFoundException();
    }
    const plan = db.sql.public.review
      .select('id', 'author', 'rating', 'text')
      .where((f, fns) => fns.eq(f.entity_id, entityId))
      .build();

    const result = await db.runtime().query(plan);

    if (!result.length) {
      throw new NotFoundException();
    }

    return result;
  }
}
