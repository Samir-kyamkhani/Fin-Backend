import { Injectable } from '@nestjs/common';
import { CreateEmployeePermissionDto } from '../dto/create-employee-permission.dto.js';
import { UpdateEmployeePermissionDto } from '../dto/update-employee-permission.dto.js';

@Injectable()
export class EmployeePermissionService {
  create(createEmployeePermissionDto: CreateEmployeePermissionDto) {
    return 'This action adds a new employeePermission';
  }

  findAll() {
    return `This action returns all employeePermission`;
  }

  findOne(id: number) {
    return `This action returns a #${id} employeePermission`;
  }

  update(id: number, updateEmployeePermissionDto: UpdateEmployeePermissionDto) {
    return `This action updates a #${id} employeePermission`;
  }

  remove(id: number) {
    return `This action removes a #${id} employeePermission`;
  }
}
