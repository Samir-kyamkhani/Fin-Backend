import { Injectable } from '@nestjs/common';
import { CreateApiEntityDto } from '../dto/create-api-entity.dto';
import { UpdateApiEntityDto } from '../dto/update-api-entity.dto';

@Injectable()
export class ApiEntityService {
  create(createApiEntityDto: CreateApiEntityDto) {
    return 'This action adds a new apiEntity';
  }

  findAll() {
    return `This action returns all apiEntity`;
  }

  findOne(id: number) {
    return `This action returns a #${id} apiEntity`;
  }

  update(id: number, updateApiEntityDto: UpdateApiEntityDto) {
    return `This action updates a #${id} apiEntity`;
  }

  remove(id: number) {
    return `This action removes a #${id} apiEntity`;
  }
}
