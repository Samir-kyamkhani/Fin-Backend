import { Module } from '@nestjs/common';
import { TransactionService } from './service/transaction.service'

@Module({
  providers: [TransactionService],
  exports: [TransactionService],
})
export class TransactionModule {}
