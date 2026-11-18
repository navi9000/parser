import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { SCRAPING_QUEUE_NAME } from './scraping.constants.js';
import { ScrapingService } from './scraping.service.js';
import { YandexService } from '../yandex/yandex.service.js';

describe('ScrapingService', () => {
  let service: ScrapingService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        ScrapingService,
        { provide: getQueueToken(SCRAPING_QUEUE_NAME), useValue: {} },
        { provide: YandexService, useValue: { parsePage: vi.fn() } },
      ],
    }).compile();

    service = module.get<ScrapingService>(ScrapingService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('returns the current job status', async () => {
    const job = {
      data: { entityId: 42 },
      failedReason: null,
      getState: vi.fn().mockResolvedValue('completed'),
    };
    Object.assign(service, {
      queue: { getJob: vi.fn().mockResolvedValue(job) },
    });

    await expect(service.getJobStatus('job-1')).resolves.toEqual({
      jobId: 'job-1',
      entityId: 42,
      status: 'completed',
      failedReason: null,
    });
  });

  it('reports a missing job', async () => {
    Object.assign(service, {
      queue: { getJob: vi.fn().mockResolvedValue(undefined) },
    });

    await expect(service.getJobStatus('job-1')).rejects.toThrow(
      'Scrape job not found',
    );
  });
});
