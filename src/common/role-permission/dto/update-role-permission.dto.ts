import { PartialType } from '@nestjs/mapped-types';
import { CreateRolePermissionDto } from './create-role-permission.dto.js';

export class UpdateRolePermissionDto extends PartialType(CreateRolePermissionDto) {}
