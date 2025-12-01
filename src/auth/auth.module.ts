import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { EmployeeService } from './services/employee.service';
import { RootService } from './services/root.service';
import { BusinessService } from './services/business.service';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, EmployeeService, RootService, BusinessService],
})
export class AuthModule {}
