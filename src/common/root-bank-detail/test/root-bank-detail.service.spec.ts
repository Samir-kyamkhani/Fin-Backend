import { Test, TestingModule } from '@nestjs/testing';
import { RootBankDetailService } from '../service/root-bank-detail.service.js';

describe('RootBankDetailService', () => {
  let service: RootBankDetailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RootBankDetailService],
    }).compile();

    service = module.get<RootBankDetailService>(RootBankDetailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
