import { Module } from '@nestjs/common';
import { IdempotencyKeyService } from './service/idempotency-key.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { IdempotencyKey } from './entities/idempotency-key.entity';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [SequelizeModule.forFeature([IdempotencyKey, User])],
  providers: [IdempotencyKeyService],
  exports: [IdempotencyKeyService],
})
export class IdempotencyKeyModule {}
