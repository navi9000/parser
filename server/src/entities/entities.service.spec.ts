import { Test, TestingModule } from '@nestjs/testing';
import { EntitiesService } from './entities.service.js';
import { EntitiesModule } from './entities.module.js';

describe('EntitiesService', () => {
  let service: EntitiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EntitiesModule],
    }).compile();

    service = module.get<EntitiesService>(EntitiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
