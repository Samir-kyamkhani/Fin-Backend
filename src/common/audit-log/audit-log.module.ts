import { Module } from '@nestjs/common';
import { AuditLogService } from './service/audit-log.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuditLog } from './entities/audit-log.entity';
import { Root } from 'src/root/entities/root.entity';
import { User } from 'src/user/entities/user.entity';
import { Employee } from 'src/employee/entities/employee.entity';

@Module({
  imports: [SequelizeModule.forFeature([AuditLog, Root, User, Employee])],
  providers: [AuditLogService],
  exports: [AuditLogService, SequelizeModule],
})
export class AuditLogModule {}
