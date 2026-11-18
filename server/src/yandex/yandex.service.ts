import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';

export interface ScrapedReview {
  author: string;
  rating: number;
  text: string;
  timestamp: string;
}

export interface ScrapedOffice {
  name: string;
  reviewList: ScrapedReview[];
}

@Injectable()
export class YandexService {
  parsedUrlOrNull(input: string) {
    try {
      const parsedUrl = new URL(input);
      if (
        !['yandex.com', 'www.yandex.com'].includes(parsedUrl.hostname) ||
        !['http:', 'https:'].includes(parsedUrl.protocol)
      ) {
        return null;
      }
      const [maps, org, slug, office_id, ...extraSegments] = parsedUrl.pathname
        .split('/')
        .filter(Boolean);
      if (
        maps !== 'maps' ||
        org !== 'org' ||
        !slug ||
        !office_id ||
        extraSegments.length > 1 ||
        extraSegments.some((segment) => segment !== 'reviews')
      ) {
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

  async parsePage({
    slug,
    office_id,
  }: {
    slug: string;
    office_id: string;
  }): Promise<ScrapedOffice> {
    const browser = await puppeteer.launch();
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1800, height: 1080 });
      await page.setExtraHTTPHeaders({
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Mobile Safari/537.36',
      });
      await page.goto(
        `https://yandex.com/maps/org/${encodeURIComponent(slug)}/${encodeURIComponent(office_id)}/reviews`,
        { waitUntil: 'domcontentloaded' },
      );
      await page.waitForSelector('.card-title-view__title');

      const scraped = await page.$$eval(
        '.business-reviews-card-view__review',
        (elements) => {
          const text = (selector: string, root: Element) =>
            root.querySelector(selector)?.textContent?.trim() ?? '';

          return elements.map((element) => {
            const ratingText =
              element
                .querySelector('.business-rating-badge-view__stars')
                ?.getAttribute('aria-label')
                ?.split(' ')[1] ?? '';

            return {
              author: text('.business-review-view__link > span', element),
              rating: Number(ratingText),
              text: text('.spoiler-view__text-container', element),
              timestamp:
                element
                  .querySelector('.business-review-view__date > meta')
                  ?.getAttribute('content') ?? '',
            };
          });
        },
      );
      const name = await page.$eval(
        '.card-title-view__title',
        (element) => element.textContent?.trim() ?? '',
      );

      const reviewList = scraped.filter((review): review is ScrapedReview =>
        Boolean(
          review.author &&
          review.text &&
          review.timestamp &&
          Number.isInteger(review.rating) &&
          review.rating >= 1 &&
          review.rating <= 5 &&
          !Number.isNaN(Date.parse(review.timestamp)),
        ),
      );
      if (!name) {
        throw new Error('Yandex page did not contain a company name');
      }

      return { name, reviewList };
    } finally {
      await browser.close();
    }
  }
}
