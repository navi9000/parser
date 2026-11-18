import { getQueueToken } from '@nestjs/bullmq';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { firstValueFrom } from 'rxjs';
import { db } from '../prisma/db.js';
import { YandexService } from '../yandex/yandex.service.js';
import { SCRAPING_QUEUE_NAME } from './scraping.constants.js';
import { ScrapingService } from './scraping.service.js';

describe('ScrapingService', () => {
  let service: ScrapingService;
  let module: TestingModule;
  let parsePage: ReturnType<typeof vi.fn>;
  let queue: {
    add: ReturnType<typeof vi.fn>;
    getJob: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    parsePage = vi.fn();
    queue = {
      add: vi.fn().mockResolvedValue({ id: 'job-1' }),
      getJob: vi.fn(),
    };
    module = await Test.createTestingModule({
      providers: [
        ScrapingService,
        { provide: getQueueToken(SCRAPING_QUEUE_NAME), useValue: queue },
        { provide: YandexService, useValue: { parsePage } },
      ],
    }).compile();

    service = module.get(ScrapingService);
  });

  afterEach(async () => {
    await module.close();
    vi.restoreAllMocks();
  });

  it('enqueues a scrape job for the requested entity', async () => {
    await expect(service.requestRefresh(42)).resolves.toEqual({
      jobId: 'job-1',
    });
    expect(queue.add).toHaveBeenCalledWith(
      'refresh-office',
      { entityId: 42 },
      { deduplication: { id: 'entity-42' } },
    );
  });

  it('notifies the client when the job has exhausted its retries', async () => {
    queue.getJob.mockResolvedValue({
      data: { entityId: 42 },
      getState: vi.fn().mockResolvedValue('failed'),
    });

    await expect(firstValueFrom(service.watchJob('job-1'))).resolves.toEqual({
      status: 'failed',
      message: expect.stringContaining('3 attempts'),
    });
  });

  it('completes successfully when a scrape finds no reviews', async () => {
    const entity = {
      id: 42,
      slug: 'example',
      office_id: '1',
      name: null,
      review_count: 0,
      avg_rating: '0.00',
      last_updated_at: null,
    };
    const update = vi.fn().mockResolvedValue({
      ...entity,
      name: 'Example',
      last_updated_at: '2025-01-01T00:00:00.000Z',
    });
    const createReview = vi.fn();
    const transactionClient = {
      orm: {
        public: {
          Entity: {
            first: vi.fn().mockResolvedValue(entity),
            where: vi.fn(() => ({ update })),
          },
          Review: {
            where: vi.fn(() => ({
              select: vi.fn(() => ({
                all: vi.fn().mockResolvedValue([]),
              })),
            })),
            create: createReview,
          },
        },
      },
    };
    vi.spyOn(db.orm.public.Entity, 'first').mockResolvedValue(entity);
    vi.spyOn(db, 'transaction').mockImplementation(async (callback) =>
      callback(transactionClient as never),
    );
    parsePage.mockResolvedValue({ name: 'Example', reviewList: [] });

    await expect(service.processScrape(42)).resolves.toEqual({ entityId: 42 });
    expect(createReview).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith({
      name: 'Example',
      review_count: 0,
      avg_rating: '0.00',
      last_updated_at: expect.any(String),
    });
  });

  it('fails when the entity does not exist', async () => {
    vi.spyOn(db.orm.public.Entity, 'first').mockResolvedValue(null);

    await expect(service.processScrape(42)).rejects.toThrow(
      new NotFoundException('Entity 42 not found'),
    );
    expect(parsePage).not.toHaveBeenCalled();
  });

  it('propagates scrape failures so BullMQ can retry them', async () => {
    const entity = {
      id: 42,
      slug: 'example',
      office_id: '1',
      name: null,
      review_count: 0,
      avg_rating: '0.00',
      last_updated_at: null,
    };
    const scrapeError = new Error('Yandex is unavailable');
    vi.spyOn(db.orm.public.Entity, 'first').mockResolvedValue(entity);
    parsePage.mockRejectedValue(scrapeError);

    await expect(service.processScrape(42)).rejects.toBe(scrapeError);
    expect(parsePage).toHaveBeenCalledWith({
      slug: entity.slug,
      office_id: entity.office_id,
    });
  });
});
