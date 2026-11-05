import { Module } from '@nestjs/common';
import { YandexService } from './yandex.service.js';

@Module({
  providers: [YandexService],
  exports: [YandexService],
})
export class YandexModule {}
