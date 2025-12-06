import { Module } from '@nestjs/common';
import { ApiIntigrationService } from './service/api-intigration.service'

@Module({
  imports: [],
  providers: [ApiIntigrationService],
  exports: [ApiIntigrationService],
})
export class ApiIntigrationModule {}
