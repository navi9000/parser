import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { YandexModule } from '../yandex/yandex.module.js';
import { ScrapingProcessor } from './scraping.processor.js';
import { MAX_SCRAPE_ATTEMPTS, SCRAPING_QUEUE_NAME } from './scraping.constants.js';
import { ScrapingService } from './scraping.service.js';

@Module({
  imports: [
    BullModule.registerQueue({
      name: SCRAPING_QUEUE_NAME,
      defaultJobOptions: {
        attempts: MAX_SCRAPE_ATTEMPTS,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { age: 60 * 60, count: 100 },
        removeOnFail: { age: 60 * 60, count: 100 },
      },
    }),
    YandexModule,
  ],
  providers: [ScrapingService, ScrapingProcessor],
  exports: [ScrapingService],
})
export class ScrapingModule {}
