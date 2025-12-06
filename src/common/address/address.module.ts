import { Module } from '@nestjs/common';
import { AddressService } from './service/address.service'

@Module({
  imports: [],
  providers: [AddressService],
  exports: [AddressService],
})
export class AddressModule {}
