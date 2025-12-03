import { Module } from '@nestjs/common';
import { BankDetailService } from './service/bank-detail.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { BankDetail } from './entities/bank-detail.entity';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [SequelizeModule.forFeature([BankDetail, User])],
  providers: [BankDetailService],
  exports: [BankDetailService, SequelizeModule],
})
export class BankDetailModule {}
