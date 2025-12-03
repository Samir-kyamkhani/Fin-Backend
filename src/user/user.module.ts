import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './entities/user.entity';
import { ApiEntity } from 'src/common/api-entity/entities/api-entity.entity';
import { AuditLogModule } from 'src/common/audit-log/audit-log.module';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';
import { CommenUserService } from './services/common/common.user.service';
import { Role } from 'src/common/role/entities/role.entity';
import { Wallet } from 'src/common/wallet/entities/wallet.entity';
import { BankDetail } from 'src/common/bank-detail/entities/bank-detail.entity';
import { UserKyc } from 'src/common/user-kyc/entities/user-kyc.entity';
import { BusinessKyc } from 'src/common/business-kyc/entities/business-kyc.entity';
import { Transaction } from 'src/common/transaction/entities/transaction.entity';
import { CommissionEarning } from 'src/common/commission-earning/entities/commission-earning.entity';
import { RootCommissionEarning } from 'src/common/root-commission-earning/entities/root-commission-earning.entity';
import { UserPermission } from 'src/common/user-permission/entities/user-permission.entity';
import { PiiConsent } from 'src/common/pii-consent/entities/pii-consent.entity';
import { IpWhitelist } from 'src/common/ip-whitelist/entities/ip-whitelist.entity';
import { ServiceProvider } from 'src/common/service-provider/entities/service-provider.entity';
import { CommissionSetting } from 'src/common/commission-setting/entities/commission-setting.entity';
import { Department } from 'src/common/department/entities/department.entity';
import { Employee } from 'src/employee/entities/employee.entity';
import { RoleModule } from 'src/common/role/role.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      User,
      Role,
      Wallet,
      BankDetail,
      UserKyc,
      BusinessKyc,
      Transaction,
      CommissionEarning,
      RootCommissionEarning,
      UserPermission,
      PiiConsent,
      ApiEntity,
      IpWhitelist,
      ServiceProvider,
      Employee,
      CommissionSetting,
      Department,
    ]),
    forwardRef(() => RoleModule),
    AuditLogModule,
  ],
  controllers: [UserController],
  providers: [UserService, CommenUserService],
  exports: [UserService, CommenUserService, SequelizeModule],
})
export class UserModule {}
