import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { EmployeeService } from './employee/employee.service';
import { RootService } from './root/root.service';
import { BusinessService } from './business/business.service';
import { CommonService } from './common/common.service';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    EmployeeService,
    RootService,
    BusinessService,
    CommonService,
  ],
})
export class AuthModule {}
