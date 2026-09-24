import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { EntitiesModule } from './entities/entities.module.js';
import { ReviewsModule } from './reviews/reviews.module.js';

@Module({
  imports: [UsersModule, AuthModule, EntitiesModule, ReviewsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
