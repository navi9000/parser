import { Module } from '@nestjs/common';
import { EntitiesController } from './entities.controller.js';
import { EntitiesService } from './entities.service.js';
import { ReviewsService } from '../reviews/reviews.service.js';

@Module({
  controllers: [EntitiesController],
  providers: [EntitiesService, ReviewsService],
})
export class EntitiesModule {}
