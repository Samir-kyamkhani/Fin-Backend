import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from './auth/auth.module';
import { UtilsModule } from './utils/utils.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ApiEntityModule } from './common/api-entity/api-entity.module';
import { ApiWebhookModule } from './common/api-webhook/api-webhook.module';
import { AuditLogModule } from './common/audit-log/audit-log.module';
// import { UserBankDetailModule } from './user-bank-detail/user-bank-detail.module';
// import { UserCommissionEarningModule } from './user-commission-earning/user-commission-earning.module';
// import { UserLedgerEntryModule } from './user-ledger-entry/user-ledger-entry.module';
// import { RootBankDetailModule } from './root-bank-detail/root-bank-detail.module';
// import { RootCommissionEarningModule } from './root-commission-earning/root-commission-earning.module';
// import { RootLedgerEntryModule } from './root-ledger-entry/root-ledger-entry.module';
// import { RootWalletModule } from './root-wallet/root-wallet.module';
// import { UserTransactionModule } from './user-transaction/user-transaction.module';
// import { UserWalletModule } from './user-wallet/user-wallet.module';
// import { EmployeeModule } from './employee/employee.module';
// import { RootModule } from './root/root.module';
// import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME,
      models: [],
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
    // UserBankDetailModule,
    // UserCommissionEarningModule,
    // UserLedgerEntryModule,
    // RootBankDetailModule,
    // RootCommissionEarningModule,
    // RootLedgerEntryModule,
    // RootWalletModule,
    // UserTransactionModule,
    // UserWalletModule,
    // EmployeeModule,
    // RootModule,
    // UserModule,
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
