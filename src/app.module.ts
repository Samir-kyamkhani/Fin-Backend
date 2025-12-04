import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module.js';
import { UtilsModule } from './utils/utils.module.js';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ApiEntityModule } from './common/api-entity/api-entity.module.js';
import { ApiWebhookModule } from './common/api-webhook/api-webhook.module.js';
import { AuditLogModule } from './common/audit-log/audit-log.module.js';
import { BankDetailModule } from './common/bank-detail/bank-detail.module.js';
import { CommissionEarningModule } from './common/commission-earning/commission-earning.module.js';
import { LedgerEntryModule } from './common/ledger-entry/ledger-entry.module.js';
import { RootBankDetailModule } from './common/root-bank-detail/root-bank-detail.module.js';
import { RootCommissionEarningModule } from './common/root-commission-earning/root-commission-earning.module.js';
import { RootLedgerEntryModule } from './common/root-ledger-entry/root-ledger-entry.module.js';
import { RootWalletModule } from './common/root-wallet/root-wallet.module.js';
import { TransactionModule } from './common/transaction/transaction.module.js';
import { WalletModule } from './common/wallet/wallet.module.js';
import { EmployeeModule } from './employee/employee.module.js';
import { RootModule } from './root/root.module.js';
import { UserModule } from './user/user.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        },
      ],
    }),
    AuthModule,
    UtilsModule,
    ApiEntityModule,
    ApiWebhookModule,
    AuditLogModule,
    BankDetailModule,
    CommissionEarningModule,
    LedgerEntryModule,
    RootBankDetailModule,
    RootCommissionEarningModule,
    RootLedgerEntryModule,
    RootWalletModule,
    TransactionModule,
    WalletModule,
    EmployeeModule,
    RootModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
