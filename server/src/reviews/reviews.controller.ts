import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ReviewsService } from './reviews.service.js';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  create(@Body() createReviewDto: any) {
    return this.reviewsService.create(createReviewDto);
  }

  @Get('entities/:id')
  getByEntity(@Param() params: any) {
    console.log({ id: params.id });
    return this.reviewsService.getByEntity(params.id);
  }
}
