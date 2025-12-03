import { Module } from '@nestjs/common';
import { RootWalletService } from './service/root-wallet.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { RootWallet } from './entities/root-wallet.entity';
import { RootLedgerEntry } from '../root-ledger-entry/entities/root-ledger-entry.entity';
import { RootCommissionEarning } from '../root-commission-earning/entities/root-commission-earning.entity';
import { Root } from 'src/root/entities/root.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([
      RootWallet,
      RootLedgerEntry,
      RootCommissionEarning,
      Root,
    ]),
  ],
  providers: [RootWalletService],
  exports: [RootWalletService, SequelizeModule],
})
export class RootWalletModule {}
