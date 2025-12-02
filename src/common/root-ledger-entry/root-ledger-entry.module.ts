import { Module } from '@nestjs/common';
import { RootLedgerEntryService } from './service/root-ledger-entry.service';

@Module({
  providers: [RootLedgerEntryService],
})
export class RootLedgerEntryModule {}
