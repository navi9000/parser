import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UsePipes,
} from '@nestjs/common';
import { EntitiesService } from './entities.service.js';
import { CreateEntityDto } from './dto/create-entity.dto.js';
import { ValidationPipe } from '../shared/pipes/validation.pipe.js';
import { UpdateEntityDto } from './dto/update-entity.dto.js';
import { ReviewsService } from '../reviews/reviews.service.js';
import { CreateReviewDto } from '../reviews/dto/create-review.dto.js';
import { IsStringifiedNumberPipe } from '../shared/pipes/is-stringified-number.pipe.js';

@Controller('entities')
export class EntitiesController {
  constructor(
    private readonly entitiesService: EntitiesService,
    private readonly reviewsService: ReviewsService,
  ) {}

  @UsePipes(new ValidationPipe())
  @Post()
  create(@Body() createEntityDto: CreateEntityDto) {
    return this.entitiesService.create(createEntityDto);
  }

  @Get()
  getAll() {
    return this.entitiesService.getAll();
  }

  @Get(':id')
  @UsePipes(new IsStringifiedNumberPipe())
  getById(@Param('id') id: number) {
    return this.entitiesService.getById(id);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe())
  @UsePipes(new IsStringifiedNumberPipe())
  updateById(
    @Param('id') id: number,
    @Body() updateEntityDto: UpdateEntityDto,
  ) {
    return this.entitiesService.update(id, updateEntityDto);
  }

  @Get(':id/reviews')
  @UsePipes(new IsStringifiedNumberPipe())
  getCommentsByEntity(@Param('id') id: number) {
    return this.reviewsService.getCommentsByEntity(id);
  }

  @Post(':id/reviews')
  @UsePipes(new ValidationPipe())
  @UsePipes(new IsStringifiedNumberPipe())
  createReview(
    @Param('id') id: number,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.reviewsService.create(id, createReviewDto);
  }
}
