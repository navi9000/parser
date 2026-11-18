import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { EntitiesService } from './entities.service.js';
import { CreateEntityDto } from './dto/create-entity.dto.js';
import { ValidationPipe } from '../shared/pipes/validation.pipe.js';
import { UpdateEntityDto } from './dto/update-entity.dto.js';
import { ReviewsService } from '../reviews/reviews.service.js';
import { CreateReviewDto } from '../reviews/dto/create-review.dto.js';
import type {
  CompanySummary,
  EntityRecord,
  EntitySearchResult,
  ScrapeJobStatus,
} from './entities.service.js';

@Controller('entities')
export class EntitiesController {
  constructor(
    private readonly entitiesService: EntitiesService,
    private readonly reviewsService: ReviewsService,
  ) {}

  @Post()
  create(
    @Body(ValidationPipe) createEntityDto: CreateEntityDto,
  ): Promise<{ entity: EntityRecord; jobId: string }> {
    return this.entitiesService.create(createEntityDto);
  }

  @Get()
  getAll(): Promise<EntityRecord[]> {
    return this.entitiesService.getAll();
  }

  @Get('search')
  getByInput(@Query('v') search?: string): Promise<EntitySearchResult> {
    return this.entitiesService.getByInput(search);
  }

  @Get('company/:slug')
  getCompany(@Param('slug') slug: string): Promise<CompanySummary> {
    return this.entitiesService.getCompanySummary(slug);
  }

  @Get('company/:slug/reviews')
  getCompanyReviews(@Param('slug') slug: string) {
    return this.reviewsService.getCommentsByCompanySlug(slug);
  }

  @Get('jobs/:jobId')
  getScrapeJobStatus(@Param('jobId') jobId: string): Promise<ScrapeJobStatus> {
    return this.entitiesService.getScrapeJobStatus(jobId);
  }

  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number): Promise<EntityRecord> {
    return this.entitiesService.getById(id);
  }

  @Post(':id/refresh')
  @HttpCode(HttpStatus.ACCEPTED)
  refreshById(@Param('id', ParseIntPipe) id: number) {
    return this.entitiesService.requestRefresh(id);
  }

  @Put(':id')
  updateById(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateEntityDto: UpdateEntityDto,
  ): Promise<EntityRecord> {
    return this.entitiesService.update(id, updateEntityDto);
  }

  @Get(':id/reviews')
  getCommentsByEntity(@Param('id', ParseIntPipe) id: number) {
    return this.reviewsService.getCommentsByEntity(id);
  }

  @Post(':id/reviews')
  createReview(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) createReviewDto: CreateReviewDto,
  ) {
    return this.reviewsService.create(id, createReviewDto);
  }
}
