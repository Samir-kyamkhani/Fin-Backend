import { Test, TestingModule } from '@nestjs/testing';
import { IdempotencyKeyService } from '../service/idempotency-key.service.js';

describe('IdempotencyKeyService', () => {
  let service: IdempotencyKeyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IdempotencyKeyService],
    }).compile();

    service = module.get<IdempotencyKeyService>(IdempotencyKeyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
