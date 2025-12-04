import { Module } from '@nestjs/common';
import { RootLedgerEntryService } from './service/root-ledger-entry.service.js';

@Module({
  providers: [RootLedgerEntryService],
  exports: [RootLedgerEntryService],
})
export class RootLedgerEntryModule {}
