import { PartialType } from '@nestjs/mapped-types';
import { CreateDepartmentPermissionDto } from './create-department-permission.dto.js';

export class UpdateDepartmentPermissionDto extends PartialType(CreateDepartmentPermissionDto) {}
