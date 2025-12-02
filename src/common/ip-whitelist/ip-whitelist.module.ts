import { Module } from '@nestjs/common';
import { IpWhitelistService } from './service/ip-whitelist.service';

@Module({
  providers: [IpWhitelistService],
})
export class IpWhitelistModule {}
