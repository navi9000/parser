import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEntityDto } from './dto/create-entity.dto.js';
import { db } from '../prisma/db.js';

@Injectable()
export class EntitiesService {
  async create(createEntityDto: CreateEntityDto) {
    const { url, ...rest } = createEntityDto;
    const name = rest?.name ?? null;
    const review_count = rest.review_count ?? 0;
    const avg_rating = rest.avg_rating ?? '0.00';
    const plan = db.sql.public.entity
      .insert([{ url, name, review_count, avg_rating }])
      .returning('id', 'url', 'name', 'review_count', 'avg_rating')
      .build();
    const result = await db.runtime().query(plan);
    return result;
  }

  async getAll() {
    const plan = db.sql.public.entity
      .select('id', 'url', 'name', 'avg_rating', 'review_count')
      .build();

    const result = await db.runtime().query(plan);
    return result;
  }

  async getById(id: string) {
    const plan = db.sql.public.entity
      .select('id', 'url', 'name', 'avg_rating', 'review_count')
      .where((f, fns) => fns.eq(f.id, +id))
      .limit(1)
      .build();

    const result = await db.runtime().query(plan);
    if (!result.length) {
      throw new NotFoundException();
    }

    return result[0];
  }

  async update(id: string, updateEntityDto: any) {
    console.log({ id, updateEntityDto });
    const plan = db.sql.public.entity
      .update({ ...updateEntityDto })
      .where((f, fns) => fns.eq(f.id, +id))
      .returning('id', 'name', 'url', 'avg_rating', 'review_count')
      .build();

    const result = await db.runtime().query(plan);

    if (!result.length) {
      throw new NotFoundException();
    }
    return result[0];
  }
}
