import { Injectable } from '@nestjs/common';
import { CreateUserPermissionDto } from '../dto/create-user-permission.dto.js';
import { UpdateUserPermissionDto } from '../dto/update-user-permission.dto.js';

@Injectable()
export class UserPermissionService {
  create(createUserPermissionDto: CreateUserPermissionDto) {
    return 'This action adds a new userPermission';
  }

  findAll() {
    return `This action returns all userPermission`;
  }

  findOne(id: number) {
    return `This action returns a #${id} userPermission`;
  }

  update(id: number, updateUserPermissionDto: UpdateUserPermissionDto) {
    return `This action updates a #${id} userPermission`;
  }

  remove(id: number) {
    return `This action removes a #${id} userPermission`;
  }
}
