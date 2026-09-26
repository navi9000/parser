import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service.js';
import { EntitiesService } from '../entities/entities.service.js';

@Module({
  providers: [ReviewsService, EntitiesService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
