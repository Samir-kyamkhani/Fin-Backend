import { Module } from '@nestjs/common';
import { IpWhitelistService } from './service/ip-whitelist.service.js';

@Module({
  imports: [],
  providers: [IpWhitelistService],
  exports: [IpWhitelistService],
})
export class IpWhitelistModule {}
