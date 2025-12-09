import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import envConfig from './utils/config/env.config'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './auth/auth.module'
import { UtilsModule } from './utils/utils.module'
import { ApiEntityModule } from './common/api-entity/api-entity.module'
import { ApiWebhookModule } from './common/api-webhook/api-webhook.module'
import { AuditLogModule } from './common/audit-log/audit-log.module'
import { BankDetailModule } from './common/bank-detail/bank-detail.module'
import { CommissionEarningModule } from './common/commission-earning/commission-earning.module'
import { LedgerEntryModule } from './common/ledger-entry/ledger-entry.module'
import { RootBankDetailModule } from './common/root-bank-detail/root-bank-detail.module'
import { RootCommissionEarningModule } from './common/root-commission-earning/root-commission-earning.module'
import { RootLedgerEntryModule } from './common/root-ledger-entry/root-ledger-entry.module'
import { RootWalletModule } from './common/root-wallet/root-wallet.module'
import { TransactionModule } from './common/transaction/transaction.module'
import { WalletModule } from './common/wallet/wallet.module'
import { EmployeeModule } from './employee/employee.module'
import { RootModule } from './root/root.module'
import { UserModule } from './user/user.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
      cache: true, // recommended for performance
      expandVariables: true,
    }),

    // --- RATE LIMITING ---
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60_000, // 1 min
          limit: 10, // 10 requests/min default
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
