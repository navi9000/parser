import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../prisma/db.js';

@Injectable()
export class ReviewsService {
  async create(createReviewDto: any) {
    const { entity_id, author, rating, text } = createReviewDto;
    const plan = db.sql.public.review
      .insert([{ entity_id, author, rating, text }])
      .returning('id', 'entity_id', 'author', 'rating', 'text')
      .build();

    const result = await db.runtime().query(plan);

    return result[0];
  }

  async getByEntity(id: string) {
    const plan = db.sql.public.review
      .select('id', 'author', 'rating', 'text')
      .where((f, fns) => fns.eq(f.entity_id, +id))
      .build();

    const result = await db.runtime().query(plan);

    if (!result.length) {
      throw new NotFoundException();
    }

    return result;
  }
}
