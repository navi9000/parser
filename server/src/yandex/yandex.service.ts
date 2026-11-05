import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';
import fs from 'node:fs';

@Injectable()
export class YandexService {
  parsedUrlOrNull(input: string) {
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

  async parsePage({ slug, office_id }: { slug: string; office_id: string }) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 1800, height: 1080 });
    await page.emulateCPUThrottling(1.49);
    await page.setExtraHTTPHeaders({
      'User-Agent':
        'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Mobile Safari/537.36',
    });

    await page.goto(`https://yandex.com/maps/org/${slug}/${office_id}/reviews`);

    const name = await page.$eval(
      '.card-title-view__title',
      (el) => el.innerHTML,
    );

    const reviewList = await page.$$eval(
      '.business-reviews-card-view__review',
      (res) =>
        res.map((el) => ({
          author: el.querySelector('.business-review-view__link > span')
            ?.innerHTML,
          rating: Number(
            el
              .querySelector('.business-rating-badge-view__stars')
              ?.attributes.getNamedItem('aria-label')
              ?.value.split(' ')[1],
          ),
          text: el.querySelector('.spoiler-view__text-container')?.innerHTML,
          timestamp: el
            .querySelector('.business-review-view__date > meta')
            ?.attributes.getNamedItem('content')?.value,
        })),
    );

    await browser.close();

    return {
      name,
      review_count: reviewList.length,
      avg_rating: (
        reviewList.reduce((prev, curr) => prev + curr.rating, 0) /
        reviewList.length
      ).toFixed(2),
      reviewList,
    };
  }
}
