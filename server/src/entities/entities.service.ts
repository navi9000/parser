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
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import { YandexService } from '../yandex/yandex.service.js';

@Injectable()
export class EntitiesService {
  constructor(private readonly yandexService: YandexService) {}

  async create(createEntityDto: CreateEntityDto) {
    try {
      const { slug, office_id, ...rest } = createEntityDto;
      const name = rest?.name ?? null;
      const review_count = rest.review_count ?? 0;
      const avg_rating = rest.avg_rating ?? '0.00';
      const result = await db.orm.public.Entity.create({
        slug,
        office_id,
        name,
        avg_rating,
        review_count,
      });
      const ynd = await this.yandexService.parsePage({ slug, office_id });

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
      'slug',
      'office_id',
      'name',
      'avg_rating',
      'review_count',
    ).all();
  }

  async getByInput(input: string) {
    const parsedInput = this.yandexService.parsedUrlOrNull(input);
    if (parsedInput) {
      const { slug, office_id } = parsedInput;
      let entity = await this.getBySlugAndOfficeId({ slug, office_id });
      if (!entity) {
        entity = await this.create({ slug, office_id });
      }
      return entity;
    }
    const result = await db.orm.public.Entity.where({ name: input }).first();
    if (!result) {
      throw new NotFoundException();
    }
    return { ...result };
  }

  async getById(id: number) {
    const result = await db.orm.public.Entity.where({ id }).first();
    if (!result) {
      throw new NotFoundException();
    }
    return { ...result };
  }

  async getBySlugAndOfficeId({
    slug,
    office_id,
  }: {
    slug: string;
    office_id: string;
  }) {
    const result = await db.orm.public.Entity.where({
      slug,
      office_id,
    }).first();
    if (!result) {
      return null;
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

  async testPuppeteer() {
    return this.yandexService.parsePage({
      slug: 'itsports',
      office_id: '81786207255',
    });
  }
}
