import { Module } from '@nestjs/common';
import { RootCommissionEarningService } from './service/root-commission-earning.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { RootCommissionEarning } from './entities/root-commission-earning.entity';
import { Transaction } from '../transaction/entities/transaction.entity';
import { Root } from 'src/root/entities/root.entity';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([
      RootCommissionEarning,
      Root,
      User,
      Transaction,
    ]),
  ],
  providers: [RootCommissionEarningService],
  exports: [RootCommissionEarningService, SequelizeModule],
})
export class RootCommissionEarningModule {}
