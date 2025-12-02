import { Injectable } from '@nestjs/common';
import { CreateRootDto } from './dto/create-root.dto';
import { UpdateRootDto } from './dto/update-root.dto';

@Injectable()
export class RootService {
  create(createRootDto: CreateRootDto) {
    return 'This action adds a new root';
  }

  findAll() {
    return `This action returns all root`;
  }

  findOne(id: number) {
    return `This action returns a #${id} root`;
  }

  update(id: number, updateRootDto: UpdateRootDto) {
    return `This action updates a #${id} root`;
  }

  remove(id: number) {
    return `This action removes a #${id} root`;
  }
}
