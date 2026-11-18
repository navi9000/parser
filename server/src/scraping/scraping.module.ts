import { Module } from '@nestjs/common';
import { YandexModule } from '../yandex/yandex.module.js';
import { ScrapingService } from './scraping.service.js';

@Module({
  imports: [YandexModule],
  providers: [ScrapingService],
  exports: [ScrapingService],
})
export class ScrapingModule {}
