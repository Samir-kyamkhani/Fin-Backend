import { Module } from '@nestjs/common';
import { LedgerEntryService } from './service/ledger-entry.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { LedgerEntry } from './entities/ledger-entry.entity';
import { Transaction } from '../transaction/entities/transaction.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { ServiceProvider } from '../service-provider/entities/service-provider.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([
      LedgerEntry,
      Transaction,
      Wallet,
      ServiceProvider,
    ]),
  ],
  providers: [LedgerEntryService],
  exports: [LedgerEntryService, SequelizeModule],
})
export class LedgerEntryModule {}
