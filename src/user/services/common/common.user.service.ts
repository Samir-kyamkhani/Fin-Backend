import { Injectable } from '@nestjs/common';
import { CreateUserDto } from '../../dto/create-user.dto'
import { UpdateUserDto } from '../../dto/update-user.dto'

@Injectable()
export class CommenUserService {
  createAdmin(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  createUser(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  // Activate soft delete decativate
  chnageStatusAllUserById(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  updateAdmin(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  updateUser(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }
}
