import { Test, TestingModule } from '@nestjs/testing';
import { firstValueFrom } from 'rxjs';
import { ScrapingService } from './scraping.service.js';
import { YandexService } from '../yandex/yandex.service.js';

describe('ScrapingService', () => {
  let service: ScrapingService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        ScrapingService,
        { provide: YandexService, useValue: { parsePage: vi.fn() } },
      ],
    }).compile();

    service = module.get<ScrapingService>(ScrapingService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('immediately emits completion when the job already completed', async () => {
    const job = {
      data: { entityId: 42 },
      getState: vi.fn().mockResolvedValue('completed'),
    };
    Object.assign(service, {
      queue: { getJob: vi.fn().mockResolvedValue(job) },
    });

    await expect(firstValueFrom(service.watchJob('job-1'))).resolves.toEqual({
      status: 'completed',
      entityId: 42,
    });
  });

  it('immediately emits failure when the job already failed', async () => {
    const job = {
      data: { entityId: 42 },
      failedReason: 'Scrape failed',
      getState: vi.fn().mockResolvedValue('failed'),
    };
    Object.assign(service, {
      queue: { getJob: vi.fn().mockResolvedValue(job) },
    });

    await expect(firstValueFrom(service.watchJob('job-1'))).resolves.toEqual({
      status: 'failed',
      failedReason: 'Scrape failed',
    });
  });
});
