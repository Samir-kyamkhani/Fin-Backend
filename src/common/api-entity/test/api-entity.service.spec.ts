import { Test, TestingModule } from '@nestjs/testing';
import { ApiEntityService } from './api-entity.service';

describe('ApiEntityService', () => {
  let service: ApiEntityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApiEntityService],
    }).compile();

    service = module.get<ApiEntityService>(ApiEntityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
