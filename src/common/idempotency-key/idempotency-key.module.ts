import { Module } from '@nestjs/common';
import { IdempotencyKeyService } from './service/idempotency-key.service'

@Module({
  imports: [],
  providers: [IdempotencyKeyService],
  exports: [IdempotencyKeyService],
})
export class IdempotencyKeyModule {}
