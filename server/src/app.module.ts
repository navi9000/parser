import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { EntitiesModule } from './entities/entities.module.js';
import { ReviewsModule } from './reviews/reviews.module.js';

const redisConnection = {
  url: process.env['REDIS_URL'] ?? 'redis://127.0.0.1:6379',
  maxRetriesPerRequest: null,
};

@Module({
  imports: [
    BullModule.forRoot({ connection: redisConnection }),
    UsersModule,
    AuthModule,
    EntitiesModule,
    ReviewsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
