import { Module } from '@nestjs/common';
import { TransactionService } from './service/transaction.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Transaction } from './entities/transaction.entity';
import { Wallet } from 'src/common/wallet/entities/wallet.entity';
import { ApiEntity } from 'src/common/api-entity/entities/api-entity.entity';
import { ApiWebhook } from 'src/common/api-webhook/entities/api-webhook.entity';
import { CommissionEarning } from 'src/common/commission-earning/entities/commission-earning.entity';
import { RootCommissionEarning } from 'src/common/root-commission-earning/entities/root-commission-earning.entity';
import { LedgerEntry } from 'src/common/ledger-entry/entities/ledger-entry.entity';
import { Refund } from 'src/common/refund/entities/refund.entity';
import { ServiceProvider } from 'src/common/service-provider/entities/service-provider.entity';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Transaction,
      User,
      Wallet,
      ApiEntity,
      ApiWebhook,
      CommissionEarning,
      RootCommissionEarning,
      LedgerEntry,
      Refund,
      ServiceProvider,
    ]),
  ],
  providers: [TransactionService],
  exports: [TransactionService, SequelizeModule],
})
export class TransactionModule {}
