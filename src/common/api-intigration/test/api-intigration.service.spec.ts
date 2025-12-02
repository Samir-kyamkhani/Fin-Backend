import { Test, TestingModule } from '@nestjs/testing';
import { ApiIntigrationService } from '../service/api-intigration.service';

describe('ApiIntigrationService', () => {
  let service: ApiIntigrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApiIntigrationService],
    }).compile();

    service = module.get<ApiIntigrationService>(ApiIntigrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
