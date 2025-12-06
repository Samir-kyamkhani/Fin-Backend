import { PartialType } from '@nestjs/mapped-types';
import { CreateEmployeePermissionDto } from './create-employee-permission.dto'

export class UpdateEmployeePermissionDto extends PartialType(CreateEmployeePermissionDto) {}
