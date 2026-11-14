import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { YandexModule } from '../yandex/yandex.module.js';
import { ScrapingProcessor } from './scraping.processor.js';
import { ScrapingQueueEventsListener } from './scraping-queue-events.listener.js';
import { SCRAPING_QUEUE_NAME } from './scraping.constants.js';
import { ScrapingService } from './scraping.service.js';

const MAX_SCRAPE_RETRIES = 3;

@Module({
  imports: [
    BullModule.registerQueue({
      name: SCRAPING_QUEUE_NAME,
      defaultJobOptions: {
        attempts: MAX_SCRAPE_RETRIES,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 1000,
        removeOnFail: 1000,
      },
    }),
    YandexModule,
  ],
  providers: [ScrapingService, ScrapingProcessor, ScrapingQueueEventsListener],
  exports: [ScrapingService],
})
export class ScrapingModule {}
