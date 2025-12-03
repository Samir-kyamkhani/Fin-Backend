import { Module } from '@nestjs/common';
import { RootBankDetailService } from './service/root-bank-detail.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { RootBankDetail } from './entities/root-bank-detail.entity';
import { Root } from 'src/root/entities/root.entity';

@Module({
  imports: [SequelizeModule.forFeature([RootBankDetail, Root])],
  providers: [RootBankDetailService],
  exports: [RootBankDetailService, SequelizeModule],
})
export class RootBankDetailModule {}
