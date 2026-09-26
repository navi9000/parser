import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { EntitiesService } from './entities.service.js';
import { CreateEntityDto } from './dto/create-entity.dto.js';
import { ValidationPipe } from '../shared/pipes/validation.pipe.js';
import { UpdateEntityDto } from './dto/update-entity.dto.js';
import { ReviewsService } from '../reviews/reviews.service.js';
import { CreateReviewDto } from '../reviews/dto/create-review.dto.js';

@Controller('entities')
export class EntitiesController {
  constructor(
    private readonly entitiesService: EntitiesService,
    private readonly reviewsService: ReviewsService,
  ) {}

  @Post()
  create(@Body(ValidationPipe) createEntityDto: CreateEntityDto) {
    return this.entitiesService.create(createEntityDto);
  }

  @Get()
  getAll() {
    return this.entitiesService.getAll();
  }

  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.entitiesService.getById(id);
  }

  @Put(':id')
  updateById(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateEntityDto: UpdateEntityDto,
  ) {
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
