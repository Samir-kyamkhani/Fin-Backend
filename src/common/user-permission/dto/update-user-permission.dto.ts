import { PartialType } from '@nestjs/mapped-types';
import { CreateUserPermissionDto } from './create-user-permission.dto.js';

export class UpdateUserPermissionDto extends PartialType(CreateUserPermissionDto) {}
