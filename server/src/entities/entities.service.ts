import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateEntityDto } from './dto/create-entity.dto.js';
import { db } from '../prisma/db.js';
import { UpdateEntityDto } from './dto/update-entity.dto.js';
import puppeteer from 'puppeteer';
import fs from 'node:fs';

@Injectable()
export class EntitiesService {
  async create(createEntityDto: CreateEntityDto) {
    try {
      const { url, ...rest } = createEntityDto;
      const name = rest?.name ?? null;
      const review_count = rest.review_count ?? 0;
      const avg_rating = rest.avg_rating ?? '0.00';
      const result = await db.orm.public.Entity.create({
        url,
        name,
        avg_rating,
        review_count,
      });
      return { ...result };
    } catch (err) {
      if (
        err &&
        typeof err === 'object' &&
        'constraint' in err &&
        err.constraint === 'entity_url_key'
      ) {
        throw new ConflictException('Url уже существует');
      }
      throw new InternalServerErrorException(err);
    }
  }

  async getAll() {
    return await db.orm.public.Entity.select(
      'id',
      'url',
      'name',
      'avg_rating',
      'review_count',
    ).all();
  }

  async getByInput(input: string) {
    const result = await db.orm.public.Entity.where({ url: input }).first();
    if (!result) {
      throw new NotFoundException();
    }
    return { ...result };
  }

  async getById(id: number) {
    const result = await db.orm.public.Entity.where({ id }).first();
    if (!result) {
      throw new NotFoundException();
    }
    return { ...result };
  }

  async update(id: number, updateEntityDto: UpdateEntityDto) {
    const { name, avg_rating, review_count } = updateEntityDto;
    const updateData: Record<string, any> = {};
    if (typeof name !== 'undefined') {
      updateData.name = name;
    }
    if (typeof avg_rating !== 'undefined') {
      updateData.avg_rating = avg_rating;
    }
    if (typeof review_count !== 'undefined') {
      updateData.review_count = review_count;
    }
    if (!Object.keys(updateData).length) {
      throw new BadRequestException('Не указаны параметры');
    }

    const result = await db.orm.public.Entity.where({ id }).update(updateData);
    if (!result) {
      throw new NotFoundException();
    }
    return { ...result };
  }

  async updateStats(id: number, newRating: number) {
    const { avg_rating, review_count } = await this.getById(id);
    const payload = {
      review_count: review_count + 1,
      avg_rating: (
        (Number(avg_rating) * review_count * 100 + newRating * 100) /
        (100 * (review_count + 1))
      ).toFixed(2),
    };

    const result = await this.update(id, payload);

    return result;
  }

  async testPuppeteer() {
    console.log(1);
    const browser = await puppeteer.launch();
    console.log(2);
    const page = await browser.newPage();
    console.log(3);

    await page.setViewport({ width: 1800, height: 1080 });

    // await page.goto(
    //   'https://yandex.com/maps/org/itsports/81786207255/reviews/?ll=37.410879%2C55.834057&tab=reviews&z=16.53',
    // );
    // await page.goto(
    //   'https://yandex.com/maps/org/itsports/81786207255/?ll=37.410879%2C55.834057&z=16',
    // );

    await page.emulateCPUThrottling(1.49);
    await page.setExtraHTTPHeaders({
      'User-Agent':
        'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Mobile Safari/537.36',
    });

    const response = await page.goto(
      'https://yandex.com/maps/org/itsports/81786207255/reviews/',
    );

    const pageContent = await page.content();

    fs.writeFile('./yandex-maps.html', pageContent, () => {});

    // console.log({ page_content: await page.content() });

    console.log(4);
    await page.waitForSelector('body');
    console.log(4.5);

    // const head = await page.$eval('head', (el) => el.innerHTML);
    // const html = await page.$eval('body', (el) => el.innerHTML);

    // console.log({ head });
    // console.log({ html });

    // await page.waitForSelector('.body');
    // console.log(4.7);

    // await page.waitForSelector('.sidebar-container');
    // console.log(5);

    await page.waitForSelector('.card-title-view__title');
    console.log(5);

    const name = await page.$eval(
      '.card-title-view__title',
      (el) => el.innerHTML,
    );

    console.log({ name });

    // const element = await page.$eval('.childNameSection', (el) => el.innerHTML);
    // console.log({ element });

    await browser.close();

    return 'ok';
  }
}
