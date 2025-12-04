import { Test, TestingModule } from '@nestjs/testing';
import { LedgerEntryService } from '../service/ledger-entry.service.js';

describe('LedgerEntryService', () => {
  let service: LedgerEntryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LedgerEntryService],
    }).compile();

    service = module.get<LedgerEntryService>(LedgerEntryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
