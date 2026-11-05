import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service.js';
import { EntitiesModule } from '../entities/entities.module.js';

@Module({
  imports: [EntitiesModule],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
