import { Test, TestingModule } from '@nestjs/testing';
import { PiiConsentService } from '../service/pii-consent.service';

describe('PiiConsentService', () => {
  let service: PiiConsentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PiiConsentService],
    }).compile();

    service = module.get<PiiConsentService>(PiiConsentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
