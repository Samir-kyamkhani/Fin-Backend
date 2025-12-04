import { Module } from '@nestjs/common';
import { LedgerEntryService } from './service/ledger-entry.service';

@Module({
  imports: [],
  providers: [LedgerEntryService],
  exports: [LedgerEntryService],
})
export class LedgerEntryModule {}
