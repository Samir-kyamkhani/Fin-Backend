import { Module } from '@nestjs/common';
import { EmployeeService } from './services/employee.service.js';
import { EmployeeController } from './controllers/employee.controller.js';
import { AuditLogModule } from '../common/audit-log/audit-log.module.js';
import { EmployeeBusinessKYCService } from './services/employee.business-kyc.service.js';
import { EmployeeUserKYCService } from './services/employee.user-kyc.service.js';
import { BusinessKycModule } from '../common/business-kyc/business-kyc.module.js';
import { UserKycModule } from '../common/user-kyc/user-kyc.module.js';
import { EmployeeBusinessKYCController } from './controllers/employee.business-kyc.controller.js';
import { employeeUserKYCController } from './controllers/employee.user-kyc.controller.js';
import { EmployeeSystemSettingController } from './controllers/employee.system-setting.controller.js';
import { EmployeeSystemSettingService } from './services/employee.system-setting.service.js';
import { SystemSettingModule } from '../common/system-setting/system-setting.module.js';

@Module({
  imports: [
    AuditLogModule,
    UserKycModule,
    BusinessKycModule,
    SystemSettingModule,
  ],
  controllers: [
    EmployeeController,
    EmployeeBusinessKYCController,
    employeeUserKYCController,
    EmployeeSystemSettingController,
  ],
  providers: [
    EmployeeService,
    EmployeeBusinessKYCService,
    EmployeeUserKYCService,
    EmployeeSystemSettingService,
  ],
  exports: [
    EmployeeService,
    EmployeeBusinessKYCService,
    EmployeeUserKYCService,
    EmployeeSystemSettingService,
  ],
})
export class EmployeeModule {}
