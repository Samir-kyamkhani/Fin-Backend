import { Injectable } from '@nestjs/common';
import { CreateDepartmentPermissionDto } from '../dto/create-department-permission.dto'
import { UpdateDepartmentPermissionDto } from '../dto/update-department-permission.dto'

@Injectable()
export class DepartmentPermissionService {
  create(createDepartmentPermissionDto: CreateDepartmentPermissionDto) {
    return 'This action adds a new departmentPermission';
  }

  findAll() {
    return `This action returns all departmentPermission`;
  }

  findOne(id: number) {
    return `This action returns a #${id} departmentPermission`;
  }

  update(
    id: number,
    updateDepartmentPermissionDto: UpdateDepartmentPermissionDto,
  ) {
    return `This action updates a #${id} departmentPermission`;
  }

  remove(id: number) {
    return `This action removes a #${id} departmentPermission`;
  }
}
