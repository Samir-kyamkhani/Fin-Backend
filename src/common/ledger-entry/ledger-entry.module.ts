import { Module } from '@nestjs/common';
import { LedgerEntryService } from './service/ledger-entry.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { LedgerEntry } from './entities/ledger-entry.entity';

@Module({
  imports: [SequelizeModule.forFeature([LedgerEntry])],
  providers: [LedgerEntryService],
  exports: [LedgerEntryService, SequelizeModule],
})
export class LedgerEntryModule {}
