import { Test, TestingModule } from '@nestjs/testing';
import { db } from '../prisma/db.js';
import { YandexService } from '../yandex/yandex.service.js';
import { ScrapingService } from './scraping.service.js';

describe('ScrapingService', () => {
  let service: ScrapingService;
  let module: TestingModule;
  let parsePage: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    parsePage = vi.fn();
    module = await Test.createTestingModule({
      providers: [
        ScrapingService,
        { provide: YandexService, useValue: { parsePage } },
      ],
    }).compile();

    service = module.get(ScrapingService);
  });

  afterEach(async () => {
    await module.close();
    vi.restoreAllMocks();
  });

  it('fails when the entity does not exist', async () => {
    vi.spyOn(db.orm.public.Entity, 'first').mockResolvedValue(null);

    await expect(service.refreshEntity(42)).rejects.toThrow(
      'Entity 42 not found',
    );
    expect(parsePage).not.toHaveBeenCalled();
  });

  it('propagates scrape failures to the caller', async () => {
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

    await expect(service.refreshEntity(42)).rejects.toBe(scrapeError);
    expect(parsePage).toHaveBeenCalledWith({
      slug: entity.slug,
      office_id: entity.office_id,
    });
  });
});
