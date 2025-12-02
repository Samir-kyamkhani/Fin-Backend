import { Module } from '@nestjs/common';
import { EmployeeService } from './services/employee.service';
import { EmployeeController } from './controllers/employee.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Employee } from './entities/employee.entity';
import { Root } from 'src/root/entities/root.entity';
import { User } from 'src/user/entities/user.entity';
import { AuditLogModule } from 'src/common/audit-log/audit-log.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Employee,
      // Department,
      Root,
      User,
      // EmployeePermission,
    ]),
    // forwardRef(() => DepartmentsModule),
    // MailModule,
    AuditLogModule,
    // PassportModule,
    // JwtModule.register({
    //   secret: process.env.JWT_SECRET || 'secret',
    //   signOptions: { expiresIn: '1h' },
    // }),
  ],
  controllers: [EmployeeController],
  providers: [EmployeeService],
  exports: [EmployeeService, SequelizeModule],
})
export class EmployeeModule {}
