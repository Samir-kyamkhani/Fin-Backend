import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/database.connection';
import { AuditLogService } from '../../audit-log/service/audit-log.service';
import { CreateAddressDto } from '../dto/create-address.dto';
import { UpdateAddressDto } from '../dto/update-address.dto';
import { CreateAuditLogDto } from '../../audit-log/dto/create-audit-log.dto';
import { AuditStatus } from '../../audit-log/enums/audit-log.enum';
import { AddressUpdateFields } from '../interfaces/address.interface';
import { AuthActor } from '../../../auth/interface/auth.interface';

@Injectable()
export class AddressService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditLogService,
  ) {}

  // CREATE - single
  async create(dto: CreateAddressDto, currentUser: AuthActor) {
    if (!currentUser) throw new UnauthorizedException('Invalid user');

    const { address, pinCode, cityId, stateId } = dto;

    if (!address || !pinCode || !cityId || !stateId) {
      throw new BadRequestException(
        'address, pinCode, cityId and stateId are required',
      );
    }

    try {
      const role = await this.validateRole(currentUser);

      const existing = await this.prisma.address.findFirst({
        where: { address, pinCode, cityId, stateId },
      });

      if (existing) {
        await this.audit.create({
          performerType: role.name,
          performerId: currentUser.id,
          targetUserType: 'USER',
          targetUserId: currentUser.id,
          action: 'CREATE_ADDRESS',
          description: 'Duplicate address detected',
          resourceType: 'Address',
          resourceId: existing.id,
          status: AuditStatus.FAILED,
          metadata: { reason: 'Duplicate Address' },
        } satisfies CreateAuditLogDto);

        throw new ConflictException('Address already exists');
      }

      const newAddress = await this.prisma.address.create({
        data: { address, pinCode, cityId, stateId },
      });

      await this.audit.create({
        performerType: role.name,
        performerId: currentUser.id,
        targetUserType: 'USER',
        targetUserId: currentUser.id,
        action: 'CREATE_ADDRESS',
        description: 'Created Address',
        resourceType: 'Address',
        resourceId: newAddress.id,
        newData: { ...newAddress },
        status: AuditStatus.SUCCESS,
      } satisfies CreateAuditLogDto);

      return newAddress;
    } catch (err: unknown) {
      throw new InternalServerErrorException(
        err instanceof Error ? err.message : 'Unknown error',
      );
    }
  }

  // UPDATE - single
  async update(id: string, dto: UpdateAddressDto, currentUser: AuthActor) {
    if (!currentUser) throw new UnauthorizedException('Invalid user');

    if (!id) throw new BadRequestException('Address id is required');

    try {
      const role = await this.validateRole(currentUser);

      const existing = await this.prisma.address.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException('Address not found');

      const { address, pinCode, cityId, stateId } = dto;

      const duplicate = await this.prisma.address.findFirst({
        where: {
          NOT: { id },
          address: address ?? existing.address,
          pinCode: pinCode ?? existing.pinCode,
          cityId: cityId ?? existing.cityId,
          stateId: stateId ?? existing.stateId,
        },
      });

      if (duplicate) {
        await this.audit.create({
          performerType: role.name,
          performerId: currentUser.id,
          targetUserType: 'USER',
          targetUserId: currentUser.id,
          action: 'UPDATE_ADDRESS',
          description: 'Duplicate address detected on update',
          resourceType: 'Address',
          resourceId: id,
          status: AuditStatus.FAILED,
          metadata: { reason: 'Duplicate Address' },
        } satisfies CreateAuditLogDto);

        throw new ConflictException('Duplicate address exists');
      }

      const updateData: AddressUpdateFields = {};

      if (dto.address !== undefined) updateData.address = dto.address;
      if (dto.pinCode !== undefined) updateData.pinCode = dto.pinCode;
      if (dto.cityId !== undefined) updateData.cityId = dto.cityId;
      if (dto.stateId !== undefined) updateData.stateId = dto.stateId;

      const updated = await this.prisma.address.update({
        where: { id },
        data: updateData,
      });

      await this.audit.create({
        performerType: role.name,
        performerId: currentUser.id,
        targetUserType: 'USER',
        targetUserId: currentUser.id,
        action: 'UPDATE_ADDRESS',
        description: 'Updated Address',
        resourceType: 'Address',
        resourceId: id,
        oldData: { ...existing },
        newData: { ...updateData },
        status: AuditStatus.SUCCESS,
      } satisfies CreateAuditLogDto);

      return updated;
    } catch (err: unknown) {
      throw new InternalServerErrorException(
        err instanceof Error ? err.message : 'Unknown error',
      );
    }
  }

  // DELETE - single
  async delete(id: string, currentUser: AuthActor) {
    if (!currentUser) throw new UnauthorizedException('Invalid user');

    if (!id) throw new BadRequestException('Address id is required');

    try {
      const existing = await this.prisma.address.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException('Address not found');

      const role = await this.validateRole(currentUser);

      await this.prisma.address.delete({ where: { id } });

      await this.audit.create({
        performerType: role.name,
        performerId: currentUser.id,
        targetUserType: 'USER',
        targetUserId: currentUser.id,
        action: 'DELETE_ADDRESS',
        description: 'Deleted Address',
        resourceType: 'Address',
        resourceId: id,
        oldData: { ...existing },
        status: AuditStatus.SUCCESS,
      } satisfies CreateAuditLogDto);

      return { message: 'Address deleted successfully' };
    } catch (err: unknown) {
      throw new InternalServerErrorException(
        err instanceof Error ? err.message : 'Unknown error',
      );
    }
  }

  // Role validation helper (same pattern as in PiiConsentService)
  private async validateRole(currentUser: AuthActor) {
    const roleId = currentUser.roleId ?? undefined;
    if (!roleId) throw new BadRequestException('Invalid user role');

    const role = await this.prisma.role.findFirst({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException(`Role not found for roleId=${roleId}`);
    }
    return role;
  }
}
