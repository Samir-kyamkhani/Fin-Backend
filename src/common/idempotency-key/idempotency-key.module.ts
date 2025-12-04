import { Module } from '@nestjs/common';
import { IdempotencyKeyService } from './service/idempotency-key.service.js';

@Module({
  imports: [],
  providers: [IdempotencyKeyService],
  exports: [IdempotencyKeyService],
})
export class IdempotencyKeyModule {}
