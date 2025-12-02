import { Module } from '@nestjs/common';
import { LedgerEntryService } from './service/ledger-entry.service';

@Module({
  providers: [LedgerEntryService],
})
export class LedgerEntryModule {}
