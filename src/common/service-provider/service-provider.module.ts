import { Module } from '@nestjs/common';
import { ServiceProviderService } from './service/service-provider.service.js';

@Module({
  providers: [ServiceProviderService],
  exports: [ServiceProviderService],
})
export class ServiceProviderModule {}
