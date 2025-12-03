import { Module } from '@nestjs/common';
import { CommissionEarningService } from './service/commission-earning.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { CommissionEarning } from './entities/commission-earning.entity';
import { Transaction } from '../transaction/entities/transaction.entity';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [SequelizeModule.forFeature([CommissionEarning, User, Transaction])],
  providers: [CommissionEarningService],
  exports: [CommissionEarningService, SequelizeModule],
})
export class CommissionEarningModule {}
