import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { db } from '../prisma/db.js';
import { ScrapingService } from '../scraping/scraping.service.js';
import {
  aggregateOfficeStats,
  updateReviewStats,
} from '../scraping/scraping.utils.js';
import { YandexService } from '../yandex/yandex.service.js';
import { CreateEntityDto } from './dto/create-entity.dto.js';
import { UpdateEntityDto } from './dto/update-entity.dto.js';

export interface EntityRecord {
  id: number;
  slug: string;
  office_id: string;
  name: string | null;
  review_count: number;
  avg_rating: string;
  last_updated_at: string | null;
}

export type EntitySearchResult =
  | {
      kind: 'pending';
      entity: EntityRecord;
      offices: EntityRecord[];
      jobId: string;
    }
  | {
      kind: 'office';
      entity: EntityRecord;
      offices: EntityRecord[];
    }
  | {
      kind: 'matches';
      offices: EntityRecord[];
    };

export interface CompanySummary {
  slug: string;
  name: string | null;
  office_count: number;
  review_count: number;
  avg_rating: string;
  offices: EntityRecord[];
}

export interface ScrapeJobStatus {
  jobId: string;
  entityId: number;
  status: string;
  progress: boolean | number | string | object;
  failedReason: string | null;
}

@Injectable()
export class EntitiesService {
  constructor(
    private readonly yandexService: YandexService,
    private readonly scrapingService: ScrapingService,
  ) {}

  async create(
    createEntityDto: CreateEntityDto,
  ): Promise<{ entity: EntityRecord; jobId: string }> {
    const { slug, office_id } = createEntityDto;
    const existing = await this.getBySlugAndOfficeId({ slug, office_id });
    if (existing) {
      throw new ConflictException('Office already exists');
    }

    const entity = await db.orm.public.Entity.create({
      slug,
      office_id,
      name: createEntityDto.name ?? null,
      review_count: createEntityDto.review_count ?? 0,
      avg_rating: createEntityDto.avg_rating ?? '0.00',
      last_updated_at: null,
    });
    const { jobId } = await this.scrapingService.requestRefresh(entity.id);
    return { entity, jobId };
  }

  async getAll(): Promise<EntityRecord[]> {
    return db.orm.public.Entity.select(
      'id',
      'slug',
      'office_id',
      'name',
      'avg_rating',
      'review_count',
      'last_updated_at',
    ).all();
  }

  async getByInput(input: string | undefined): Promise<EntitySearchResult> {
    const normalizedInput = input?.trim() ?? '';
    if (!normalizedInput) {
      throw new BadRequestException('Search value is required');
    }

    const parsedInput = this.yandexService.parsedUrlOrNull(normalizedInput);
    if (parsedInput) {
      const entity = await this.getOrCreateOffice(parsedInput);
      const offices = await this.getOfficesBySlug(entity.slug);
      if (
        !entity.last_updated_at &&
        !entity.name &&
        entity.review_count === 0
      ) {
        const { jobId } = await this.scrapingService.requestRefresh(entity.id);
        return { kind: 'pending' as const, entity, offices, jobId };
      }
      return { kind: 'office' as const, entity, offices };
    }

    const matches = await db.orm.public.Entity.where({
      name: normalizedInput,
    })
      .orderBy((entity) => entity.office_id.asc())
      .all();
    if (!matches.length) {
      throw new NotFoundException('Company not found');
    }
    const slugs = [...new Set(matches.map((office) => office.slug))];
    const offices = await db.orm.public.Entity.where((entity) =>
      entity.slug.in(slugs),
    )
      .orderBy((entity) => entity.office_id.asc())
      .all();
    return { kind: 'matches' as const, offices };
  }

  async getById(id: number): Promise<EntityRecord> {
    const result = await db.orm.public.Entity.first({ id });
    if (!result) {
      throw new NotFoundException('Office not found');
    }
    return result;
  }

  async getBySlugAndOfficeId({
    slug,
    office_id,
  }: {
    slug: string;
    office_id: string;
  }): Promise<EntityRecord | null> {
    return db.orm.public.Entity.where({ slug, office_id }).first();
  }

  async getOfficesBySlug(slug: string): Promise<EntityRecord[]> {
    return db.orm.public.Entity.where({ slug })
      .orderBy((entity) => entity.office_id.asc())
      .all();
  }

  async getCompanySummary(slug: string): Promise<CompanySummary> {
    const offices = await this.getOfficesBySlug(slug);
    if (!offices.length) {
      throw new NotFoundException('Company not found');
    }
    const stats = aggregateOfficeStats(offices);
    return {
      slug,
      name: offices.find((office) => office.name)?.name ?? null,
      office_count: offices.length,
      ...stats,
      offices,
    };
  }

  async requestRefresh(id: number): Promise<{ jobId: string }> {
    await this.getById(id);
    return this.scrapingService.requestRefresh(id);
  }

  async getScrapeJobStatus(jobId: string): Promise<ScrapeJobStatus> {
    return this.scrapingService.getJobStatus(jobId);
  }

  async update(
    id: number,
    updateEntityDto: UpdateEntityDto,
  ): Promise<EntityRecord> {
    const updateData: {
      name?: string;
      avg_rating?: string;
      review_count?: number;
    } = {};
    if (typeof updateEntityDto.name !== 'undefined') {
      updateData.name = updateEntityDto.name;
    }
    if (typeof updateEntityDto.avg_rating !== 'undefined') {
      updateData.avg_rating = updateEntityDto.avg_rating;
    }
    if (typeof updateEntityDto.review_count !== 'undefined') {
      updateData.review_count = updateEntityDto.review_count;
    }
    if (!Object.keys(updateData).length) {
      throw new BadRequestException('No update fields provided');
    }

    const result = await db.orm.public.Entity.where({ id }).update(updateData);
    if (!result) {
      throw new NotFoundException('Office not found');
    }
    return result;
  }

  async updateStats(id: number, newRating: number): Promise<EntityRecord> {
    const entity = await this.getById(id);
    const stats = updateReviewStats(entity.review_count, entity.avg_rating, [
      newRating,
    ]);
    return this.update(id, stats);
  }

  private async getOrCreateOffice({
    slug,
    office_id,
  }: {
    slug: string;
    office_id: string;
  }): Promise<EntityRecord> {
    const existing = await this.getBySlugAndOfficeId({ slug, office_id });
    if (existing) {
      return existing;
    }

    try {
      return await db.orm.public.Entity.create({
        slug,
        office_id,
        name: null,
        review_count: 0,
        avg_rating: '0.00',
        last_updated_at: null,
      });
    } catch (error) {
      const concurrentInsert = await this.getBySlugAndOfficeId({
        slug,
        office_id,
      });
      if (concurrentInsert) {
        return concurrentInsert;
      }
      throw error;
    }
  }
}
