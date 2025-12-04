import { Module } from '@nestjs/common';
import { RoleService } from './service/role.service';

@Module({
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
