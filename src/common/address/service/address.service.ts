import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Address } from '../entities/address.entity';
import { CreateAddressDto } from '../dto/create-address.dto';
import { UpdateAddressDto } from '../dto/update-address.dto';
import { ValidationError } from 'sequelize';

@Injectable()
export class AddressService {
  constructor(
    @InjectModel(Address)
    private readonly addressModel: typeof Address,
  ) {}

  async create(createAddressDto: CreateAddressDto): Promise<Address> {
    try {
      const address = new Address();
      address.address = createAddressDto.address;
      address.pinCode = createAddressDto.pinCode;
      address.stateId = createAddressDto.stateId;
      address.cityId = createAddressDto.cityId;
      return await address.save();
    } catch (error: unknown) {
      if (error instanceof ValidationError) {
        // Handle Sequelize validation errors
        const messages = error.errors.map((err) => err.message).join(', ');
        throw new BadRequestException(`Validation failed: ${messages}`);
      }

      if (error instanceof Error) {
        // Check for specific error types
        if (error.name === 'SequelizeForeignKeyConstraintError') {
          throw new BadRequestException('Invalid state or city ID provided');
        }

        if (error.message.includes('duplicate')) {
          throw new ConflictException('Address already exists');
        }

        throw new InternalServerErrorException(
          `Failed to create address: ${error.message}`,
        );
      }

      throw new InternalServerErrorException(
        'Unknown error occurred while creating address',
      );
    }
  }

  async findOne(id: string): Promise<Address> {
    try {
      const address = await this.addressModel.findByPk(id, {
        include: [
          { association: 'city', attributes: ['id', 'cityName', 'cityCode'] },
          {
            association: 'state',
            attributes: ['id', 'stateName', 'stateCode'],
          },
        ],
      });

      if (!address) {
        throw new NotFoundException(`Address with ID ${id} not found`);
      }

      return address;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error instanceof Error) {
        throw new InternalServerErrorException(
          `Failed to fetch address: ${error.message}`,
        );
      }

      throw new InternalServerErrorException(
        'Unknown error occurred while fetching address',
      );
    }
  }

  async update(
    id: string,
    updateAddressDto: UpdateAddressDto,
  ): Promise<Address> {
    try {
      const address = await this.findOne(id);

      const updateData: Partial<Address> = {};
      if (updateAddressDto.address !== undefined) {
        updateData.address = updateAddressDto.address;
      }
      if (updateAddressDto.pinCode !== undefined) {
        updateData.pinCode = updateAddressDto.pinCode;
      }
      if (updateAddressDto.stateId !== undefined) {
        updateData.stateId = updateAddressDto.stateId;
      }
      if (updateAddressDto.cityId !== undefined) {
        updateData.cityId = updateAddressDto.cityId;
      }

      await address.update(updateData);
      return address.reload();
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error instanceof ValidationError) {
        const messages = error.errors.map((err) => err.message).join(', ');
        throw new BadRequestException(`Validation failed: ${messages}`);
      }

      if (error instanceof Error) {
        if (error.name === 'SequelizeForeignKeyConstraintError') {
          throw new BadRequestException('Invalid state or city ID provided');
        }

        throw new InternalServerErrorException(
          `Failed to update address: ${error.message}`,
        );
      }

      throw new InternalServerErrorException(
        'Unknown error occurred while updating address',
      );
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    try {
      const address = await this.findOne(id);

      // Check if address is being used
      const userKycsCount = await address.$count('userKycs');
      const businessKycsCount = await address.$count('businessKycs');

      if (userKycsCount > 0 || businessKycsCount > 0) {
        throw new BadRequestException(
          `Cannot delete address. It is being used by ${userKycsCount} user KYC(s) and ${businessKycsCount} business KYC(s)`,
        );
      }

      await address.destroy();
      return { message: `Address with ID ${id} deleted successfully` };
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error instanceof BadRequestException) {
        throw error;
      }

      if (error instanceof Error) {
        throw new InternalServerErrorException(
          `Failed to delete address: ${error.message}`,
        );
      }

      throw new InternalServerErrorException(
        'Unknown error occurred while deleting address',
      );
    }
  }
}
