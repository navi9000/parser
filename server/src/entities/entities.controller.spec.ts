import { Test, TestingModule } from '@nestjs/testing';
import { EntitiesController } from './entities.controller.js';
import { EntitiesService } from './entities.service.js';
import { ReviewsService } from '../reviews/reviews.service.js';

describe('EntitiesController', () => {
  let controller: EntitiesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntitiesController],
      providers: [
        { provide: EntitiesService, useValue: {} },
        { provide: ReviewsService, useValue: {} },
      ],
    }).compile();

    controller = module.get<EntitiesController>(EntitiesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
