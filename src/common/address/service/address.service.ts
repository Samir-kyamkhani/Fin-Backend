import { Injectable } from '@nestjs/common';
import { CreateAddressDto } from '../dto/create-address.dto';
import { UpdateAddressDto } from '../dto/update-address.dto';

@Injectable()
export class AddressService {
  async create(createAddressDto: CreateAddressDto) {}

  async findOne(id: string) {}

  async update(id: string, updateAddressDto: UpdateAddressDto) {}

  async remove(id: string) {}
}
