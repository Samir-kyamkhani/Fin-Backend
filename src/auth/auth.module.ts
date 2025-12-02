import { Module } from '@nestjs/common';
import { EmployeeAuthService } from './services/employee.auth.service';
import { EmployeeAuthController } from './controllers/employee.auth.controller';

@Module({
  controllers: [EmployeeAuthController],
  providers: [EmployeeAuthService],
})
export class AuthModule {}
