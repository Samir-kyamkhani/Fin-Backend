import { Module } from '@nestjs/common';
import { ServiceProviderService } from './service/service-provider.service'

@Module({
  providers: [ServiceProviderService],
  exports: [ServiceProviderService],
})
export class ServiceProviderModule {}
