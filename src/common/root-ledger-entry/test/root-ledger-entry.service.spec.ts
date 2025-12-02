import { Test, TestingModule } from '@nestjs/testing';
import { RootLedgerEntryService } from '../service/root-ledger-entry.service';

describe('RootLedgerEntryService', () => {
  let service: RootLedgerEntryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RootLedgerEntryService],
    }).compile();

    service = module.get<RootLedgerEntryService>(RootLedgerEntryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
