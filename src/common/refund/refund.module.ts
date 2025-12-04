import { Module } from '@nestjs/common';
import { RefundService } from './service/refund.service.js';

@Module({
  providers: [RefundService],
  exports: [RefundService],
})
export class RefundModule {}
