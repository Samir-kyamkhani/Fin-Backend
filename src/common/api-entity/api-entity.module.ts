import { Module } from '@nestjs/common';
import { ApiEntityService } from './service/api-entity.service';

@Module({
  imports: [],
  providers: [ApiEntityService],
  exports: [ApiEntityService],
})
export class ApiEntityModule {}
