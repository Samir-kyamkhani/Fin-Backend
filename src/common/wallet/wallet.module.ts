import { Module } from '@nestjs/common';
import { WalletService } from './service/wallet.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Wallet } from './entities/wallet.entity';
import { LedgerEntry } from '../ledger-entry/entities/ledger-entry.entity';
import { Transaction } from '../transaction/entities/transaction.entity';

@Module({
  imports: [SequelizeModule.forFeature([Wallet, LedgerEntry, Transaction])],
  providers: [WalletService],
  exports: [WalletService, SequelizeModule],
})
export class WalletModule {}
