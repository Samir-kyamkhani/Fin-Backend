import { Test, TestingModule } from '@nestjs/testing';
import { CommissionEarningService } from '../service/commission-earning.service.js';

describe('CommissionEarningService', () => {
  let service: CommissionEarningService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommissionEarningService],
    }).compile();

    service = module.get<CommissionEarningService>(CommissionEarningService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
