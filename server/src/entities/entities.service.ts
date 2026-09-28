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
      const result = await db.orm.public.Entity.create({
        url,
        name,
        avg_rating,
        review_count,
      });
      return { ...result };
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
    return await db.orm.public.Entity.select(
      'id',
      'url',
      'name',
      'avg_rating',
      'review_count',
    ).all();
  }

  async getById(id: number) {
    const result = await db.orm.public.Entity.where({ id }).first();
    if (!result) {
      throw new NotFoundException();
    }
    return { ...result };
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

    const result = await db.orm.public.Entity.where({ id }).update(updateData);
    if (!result) {
      throw new NotFoundException();
    }
    return { ...result };
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
