import { Module } from '@nestjs/common';
import { EntitiesController } from './entities.controller.js';
import { EntitiesService } from './entities.service.js';
import { ReviewsService } from '../reviews/reviews.service.js';
import { YandexModule } from '../yandex/yandex.module.js';

@Module({
  imports: [YandexModule],
  controllers: [EntitiesController],
  providers: [EntitiesService, ReviewsService],
  exports: [EntitiesService],
})
export class EntitiesModule {}
