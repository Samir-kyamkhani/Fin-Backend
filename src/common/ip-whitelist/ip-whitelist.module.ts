import { Module } from '@nestjs/common';
import { IpWhitelistService } from './service/ip-whitelist.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { IpWhitelist } from './entities/ip-whitelist.entity';
import { User } from 'src/user/entities/user.entity';
import { Root } from 'src/root/entities/root.entity';

@Module({
  imports: [SequelizeModule.forFeature([IpWhitelist, User, Root])],
  providers: [IpWhitelistService],
  exports: [IpWhitelistService],
})
export class IpWhitelistModule {}
