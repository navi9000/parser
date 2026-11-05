import { Injectable } from '@nestjs/common';

@Injectable()
export class YandexService {
  async parsedUrlOrNull(input: string) {
    try {
      const parsedUrl = new URL(input);
      const hostname = parsedUrl.hostname;
      const pathname = parsedUrl.pathname;

      if (hostname !== 'yandex.com') {
        return null;
      }
      const [_leadingBlank, maps, org, slug, office_id] = pathname.split('/');
      if (maps !== 'maps' || org !== 'org') {
        return null;
      }

      return {
        slug,
        office_id,
      };
    } catch {
      return null;
    }
  }
}
