import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller.js';
import { ReviewsService } from './reviews.service.js';
import { EntitiesService } from '../entities/entities.service.js';

@Module({
  controllers: [ReviewsController],
  providers: [ReviewsService, EntitiesService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
