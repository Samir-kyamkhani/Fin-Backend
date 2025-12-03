import { Module } from '@nestjs/common';
import { RefundService } from './service/refund.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Refund } from './entities/refund.entity';
import { Transaction } from 'sequelize';

@Module({
  imports: [SequelizeModule.forFeature([Refund, Transaction])],
  providers: [RefundService],
  exports: [RefundService],
})
export class RefundModule {}
