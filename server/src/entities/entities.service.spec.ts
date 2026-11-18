import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ScrapingService } from '../scraping/scraping.service.js';
import { YandexService } from '../yandex/yandex.service.js';
import { EntitiesService } from './entities.service.js';

describe('EntitiesService', () => {
  let service: EntitiesService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        EntitiesService,
        {
          provide: YandexService,
          useValue: { parsedUrlOrNull: vi.fn().mockReturnValue(null) },
        },
        { provide: ScrapingService, useValue: { requestRefresh: vi.fn() } },
      ],
    }).compile();

    service = module.get<EntitiesService>(EntitiesService);
  });

  afterEach(async () => {
    await module.close();
    vi.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects invalid URLs rather than treating them as company searches', async () => {
    await expect(
      service.getByInput('https://example.com/not-a-yandex-office'),
    ).rejects.toThrow(BadRequestException);
  });
});
