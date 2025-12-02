import { Module } from '@nestjs/common';
import { IdempotencyKeyService } from './service/idempotency-key.service';

@Module({
  providers: [IdempotencyKeyService],
})
export class IdempotencyKeyModule {}
