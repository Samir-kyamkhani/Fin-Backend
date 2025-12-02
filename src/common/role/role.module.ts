import { Module } from '@nestjs/common';
import { RoleService } from './service/role.service';

@Module({
  providers: [RoleService],
})
export class RoleModule {}
