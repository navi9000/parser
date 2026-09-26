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
  getById(@Param('id') id: string) {
    return this.entitiesService.getById(id);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe())
  updateById(
    @Param('id') id: string,
    @Body() updateEntityDto: UpdateEntityDto,
  ) {
    return this.entitiesService.update(id, updateEntityDto);
  }

  @Get(':id/reviews')
  getCommentsByEntity(@Param('id') id: string) {
    return this.reviewsService.getCommentsByEntity(id);
  }
}
