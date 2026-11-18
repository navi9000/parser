import { YandexService } from './yandex.service.js';

describe('YandexService', () => {
  const service = new YandexService();

  it('extracts the slug and office ID from a Yandex Maps URL', () => {
    expect(
      service.parsedUrlOrNull(
        'https://yandex.com/maps/org/company-slug/123456789/reviews',
      ),
    ).toEqual({ slug: 'company-slug', office_id: '123456789' });
  });

  it('rejects unsupported hosts and incomplete office URLs', () => {
    expect(
      service.parsedUrlOrNull('https://example.com/maps/org/company/123'),
    ).toBeNull();
    expect(
      service.parsedUrlOrNull('https://yandex.com/maps/org/company'),
    ).toBeNull();
  });
});
