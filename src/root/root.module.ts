import { Module, forwardRef } from '@nestjs/common';
import { RootService } from './services/root.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Root } from './entities/root.entity';
import { AuditLogModule } from 'src/common/audit-log/audit-log.module';
import { RootController } from './controllers/root.controller';
import { RootWallet } from 'src/common/root-wallet/entities/root-wallet.entity';
import { RootBankDetail } from 'src/common/root-bank-detail/entities/root-bank-detail.entity';
import { RootCommissionEarning } from 'src/common/root-commission-earning/entities/root-commission-earning.entity';
import { Role } from 'src/common/role/entities/role.entity';
import { RoleModule } from 'src/common/role/role.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Root,
      RootWallet,
      RootBankDetail,
      RootCommissionEarning,
      Role,
    ]),
    forwardRef(() => RoleModule),
    AuditLogModule,
  ],
  controllers: [RootController],
  providers: [RootService],
  exports: [RootService, SequelizeModule],
})
export class RootModule {}
