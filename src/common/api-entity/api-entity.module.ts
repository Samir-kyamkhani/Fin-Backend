import { Module } from '@nestjs/common';
import { ApiEntityService } from './service/api-entity.service.js';

@Module({
  imports: [],
  providers: [ApiEntityService],
  exports: [ApiEntityService],
})
export class ApiEntityModule {}
