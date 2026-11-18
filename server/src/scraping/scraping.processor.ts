import { Logger } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Worker } from 'bullmq';
import { SCRAPING_QUEUE_NAME } from './scraping.constants.js';
import {
  ScrapingService,
  type ScrapeJobData,
  type ScrapeJobResult,
} from './scraping.service.js';

@Processor(SCRAPING_QUEUE_NAME, { concurrency: 1 })
export class ScrapingProcessor extends WorkerHost<
  Worker<ScrapeJobData, ScrapeJobResult>
> {
  private readonly logger = new Logger(ScrapingProcessor.name);

  constructor(private readonly scrapingService: ScrapingService) {
    super();
  }

  process(job: Job<ScrapeJobData, ScrapeJobResult>): Promise<ScrapeJobResult> {
    return this.scrapingService.processScrape(job.data.entityId);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<ScrapeJobData, ScrapeJobResult> | undefined, error: Error) {
    if (job) {
      this.logger.error(
        `Scrape attempt ${job.attemptsMade} failed for entity ${job.data.entityId}`,
        error.stack,
      );
    }
  }
}
