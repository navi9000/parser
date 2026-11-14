import { Logger } from '@nestjs/common';
import {
  OnQueueEvent,
  QueueEventsHost,
  QueueEventsListener,
} from '@nestjs/bullmq';
import { SCRAPING_QUEUE_NAME } from './scraping.constants.js';
import { ScrapingService } from './scraping.service.js';

@QueueEventsListener(SCRAPING_QUEUE_NAME)
export class ScrapingQueueEventsListener extends QueueEventsHost {
  private readonly logger = new Logger(ScrapingQueueEventsListener.name);

  constructor(private readonly scrapingService: ScrapingService) {
    super();
  }

  @OnQueueEvent('completed')
  onCompleted({ jobId }: { jobId: string }) {
    void this.scrapingService.publishTerminalJobEvent(jobId, 'completed');
  }

  @OnQueueEvent('failed')
  onFailed({ jobId }: { jobId: string }) {
    void this.scrapingService.publishTerminalJobEvent(jobId, 'failed');
  }

  @OnQueueEvent('error')
  onError(error: Error) {
    this.logger.error('Scraping queue events error', error.stack);
    this.scrapingService.handleQueueEventsError(error);
  }
}
