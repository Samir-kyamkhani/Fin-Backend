import { Test, TestingModule } from '@nestjs/testing';
import { BusinessKycService } from '../service/business-kyc.service';

describe('BusinessKycService', () => {
  let service: BusinessKycService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BusinessKycService],
    }).compile();

    service = module.get<BusinessKycService>(BusinessKycService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
