import { Module } from '@nestjs/common';
import { RoleService } from './service/role.service.js';

@Module({
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
