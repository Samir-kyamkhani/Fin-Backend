import { Injectable } from '@nestjs/common';
import { CreateApiIntigrationDto } from '../dto/create-api-intigration.dto'
import { UpdateApiIntigrationDto } from '../dto/update-api-intigration.dto'

@Injectable()
export class ApiIntigrationService {
  create(createApiIntigrationDto: CreateApiIntigrationDto) {
    return 'This action adds a new apiIntigration';
  }

  findAll() {
    return `This action returns all apiIntigration`;
  }

  findOne(id: number) {
    return `This action returns a #${id} apiIntigration`;
  }

  update(id: number, updateApiIntigrationDto: UpdateApiIntigrationDto) {
    return `This action updates a #${id} apiIntigration`;
  }

  remove(id: number) {
    return `This action removes a #${id} apiIntigration`;
  }
}
