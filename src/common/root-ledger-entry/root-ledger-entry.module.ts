import { Module } from '@nestjs/common';
import { RootLedgerEntryService } from './service/root-ledger-entry.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { RootLedgerEntry } from './entities/root-ledger-entry.entity';
import { RootCommissionEarning } from '../root-commission-earning/entities/root-commission-earning.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([RootLedgerEntry, RootCommissionEarning]),
  ],
  providers: [RootLedgerEntryService],
  exports: [RootLedgerEntryService, SequelizeModule],
})
export class RootLedgerEntryModule {}
