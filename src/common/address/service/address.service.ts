import { Injectable } from '@nestjs/common';
import { CreateAddressDto } from '../dto/create-address.dto.js';
import { UpdateAddressDto } from '../dto/update-address.dto.js';

@Injectable()
export class AddressService {
  async create(createAddressDto: CreateAddressDto) {}

  async findOne(id: string) {}

  async update(id: string, updateAddressDto: UpdateAddressDto) {}

  async remove(id: string) {}
}
