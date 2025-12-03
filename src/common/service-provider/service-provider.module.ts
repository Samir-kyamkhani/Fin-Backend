import { Module } from '@nestjs/common';
import { ServiceProviderService } from './service/service-provider.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { ServiceProvider } from './entities/service-provider.entity';
import { User } from 'src/user/entities/user.entity';
import { Root } from 'src/root/entities/root.entity';
import { Transaction } from 'sequelize';
import { RolePermission } from '../role-permission/entities/role-permission.entity';
import { LedgerEntry } from '../ledger-entry/entities/ledger-entry.entity';
import { CommissionSetting } from '../commission-setting/entities/commission-setting.entity';
import { ApiIntegration } from '../api-intigration/entities/api-intigration.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([
      ServiceProvider,
      User,
      Root,
      Transaction,
      RolePermission,
      LedgerEntry,
      CommissionSetting,
      ApiIntegration,
    ]),
  ],
  providers: [ServiceProviderService],
  exports: [ServiceProviderService],
})
export class ServiceProviderModule {}
