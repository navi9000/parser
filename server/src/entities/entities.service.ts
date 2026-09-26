import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateEntityDto } from './dto/create-entity.dto.js';
import { db } from '../prisma/db.js';
import { UpdateEntityDto } from './dto/update-entity.dto.js';

@Injectable()
export class EntitiesService {
  async create(createEntityDto: CreateEntityDto) {
    try {
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
    } catch (err) {
      if (
        err &&
        typeof err === 'object' &&
        'constraint' in err &&
        err.constraint === 'entity_url_key'
      ) {
        throw new ConflictException('Url уже существует');
      }
      throw new InternalServerErrorException(err);
    }
  }

  async getAll() {
    const plan = db.sql.public.entity
      .select('id', 'url', 'name', 'avg_rating', 'review_count')
      .build();

    const result = await db.runtime().query(plan);
    return result;
  }

  async getById(id: number) {
    const plan = db.sql.public.entity
      .select('id', 'url', 'name', 'avg_rating', 'review_count')
      .where((f, fns) => fns.eq(f.id, id))
      .limit(1)
      .build();

    const result = await db.runtime().query(plan);
    if (!result.length) {
      throw new NotFoundException();
    }

    return result[0];
  }

  async update(id: number, updateEntityDto: UpdateEntityDto) {
    const { name, avg_rating, review_count } = updateEntityDto;
    const updateData: Record<string, any> = {};
    if (typeof name !== 'undefined') {
      updateData.name = name;
    }
    if (typeof avg_rating !== 'undefined') {
      updateData.avg_rating = avg_rating;
    }
    if (typeof review_count !== 'undefined') {
      updateData.review_count = review_count;
    }
    if (!Object.keys(updateData).length) {
      throw new BadRequestException('Не указаны параметры');
    }
    const plan = db.sql.public.entity
      .update(updateData)
      .where((f, fns) => fns.eq(f.id, id))
      .returning('id', 'name', 'url', 'avg_rating', 'review_count')
      .build();

    const result = await db.runtime().query(plan);

    if (!result.length) {
      throw new NotFoundException();
    }
    return result[0];
  }

  async updateStats(id: number, newRating: number) {
    const { avg_rating, review_count } = await this.getById(id);
    const payload = {
      review_count: review_count + 1,
      avg_rating: (
        (Number(avg_rating) * review_count * 100 + newRating * 100) /
        (100 * (review_count + 1))
      ).toFixed(2),
    };

    const result = await this.update(id, payload);

    return result;
  }
}
