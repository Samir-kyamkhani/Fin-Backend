import {
  Injectable,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/database.connection';
import { CreateIpWhitelistDto } from '../dto/create-ip-whitelist.dto';
import {
  IpWhitelistCreateFields,
  // IpWhitelistFilter,
  IpWhitelistType,
  IpWhitelistUpdateFields,
} from '../types/ip-whitelist.type';
import { UpdateIpWhitelistDto } from '../dto/update-ip-whitelist.dto';
import { AuditLogService } from '../../audit-log/service/audit-log.service';
import { AuditStatus } from '../../audit-log/enums/audit-log.enum';
import { CreateAuditLogDto } from '../../audit-log/dto/create-audit-log.dto';
import { AuthActor } from '../../../auth/types/principal.type';
import { Prisma } from '../../../../generated/prisma/client';

@Injectable()
export class IpWhitelistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

  /** CREATE */
  async create(
    dto: CreateIpWhitelistDto,
    currentUser: AuthActor,
  ): Promise<IpWhitelistType> {
    if (!currentUser) throw new UnauthorizedException('Invalid user');

    const role = await this.validateRole(currentUser);

    try {
      const existing = await this.prisma.ipWhitelist.findFirst({
        where: { domainName: dto.domainName },
      });

      if (existing) {
        await this.audit.create({
          performerType: role.name,
          performerId: currentUser.id,
          targetUserType: 'USER',
          targetUserId: dto.userId,
          action: 'CREATE_IP_WHITELIST',
          description: 'Duplicate IP whitelist domain detected',
          resourceType: 'IpWhitelist',
          resourceId: existing.id,
          status: AuditStatus.FAILED,
          metadata: { reason: 'Duplicate domainName' },
        } satisfies CreateAuditLogDto);

        throw new ConflictException('domainName already exists');
      }

      const data: IpWhitelistCreateFields = {
        domainName: dto.domainName,
        serverIp: dto.serverIp,
        userId: dto.userId,
        rootId: dto.rootId ?? null,
      };

      const created = await this.prisma.ipWhitelist.create({ data });

      await this.audit.create({
        performerType: role.name,
        performerId: currentUser.id,
        targetUserType: 'USER',
        targetUserId: dto.userId,
        action: 'CREATE_IP_WHITELIST',
        description: 'Created IP whitelist entry',
        resourceType: 'IpWhitelist',
        resourceId: created.id,
        newData: { ...created },
        status: AuditStatus.SUCCESS,
      } satisfies CreateAuditLogDto);

      return created as IpWhitelistType;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create ip whitelist';

      throw new InternalServerErrorException(message);
    }
  }

  /** FIND ALL */
  async findAll(filters?: {
    userId?: string;
    search?: string;
  }): Promise<IpWhitelistType[]> {
    const where: Prisma.IpWhitelistWhereInput = {};

    // Filter by userId
    if (filters?.userId) {
      where.userId = filters.userId;
    }

    // Global search
    if (filters?.search) {
      const q = filters.search;

      where.OR = [
        { domainName: { contains: q } },
        { serverIp: { contains: q } },
        {
          user: {
            firstName: { contains: q },
          },
        },
        {
          user: {
            lastName: { contains: q },
          },
        },
      ];
    }

    return await this.prisma.ipWhitelist.findMany({
      where,
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** FIND ONE */
  async findByUserId(params: {
    rootId?: string;
    userId?: string;
  }): Promise<IpWhitelistType> {
    const { rootId, userId } = params;

    if (!rootId || !userId) {
      throw new BadRequestException('Either rootId or userId is required');
    }

    const where: Prisma.IpWhitelistWhereInput = {};

    if (rootId) where.rootId = rootId;
    if (userId) where.userId = userId;

    const found = await this.prisma.ipWhitelist.findFirst({
      where,
    });

    if (!found) {
      throw new NotFoundException('IpWhitelist not found');
    }

    return found as IpWhitelistType;
  }

  /** UPDATE */
  async update(
    id: string,
    dto: UpdateIpWhitelistDto,
    currentUser: AuthActor,
  ): Promise<IpWhitelistType> {
    if (!currentUser) throw new UnauthorizedException('Invalid user');
    if (!id) throw new BadRequestException('id is required');

    const role = await this.validateRole(currentUser);

    try {
      const existing = await this.prisma.ipWhitelist.findUnique({
        where: { id },
      });

      if (!existing) {
        await this.audit.create({
          performerType: role.name,
          performerId: currentUser.id,
          targetUserType: 'USER',
          targetUserId: id,
          action: 'UPDATE_IP_WHITELIST',
          description: 'IP whitelist not found for update',
          resourceType: 'IpWhitelist',
          resourceId: id,
          status: AuditStatus.FAILED,
          metadata: { reason: 'NotFound' },
        } satisfies CreateAuditLogDto);

        throw new NotFoundException('IpWhitelist not found');
      }

      if (dto.domainName && dto.domainName !== existing.domainName) {
        const duplicate = await this.prisma.ipWhitelist.findFirst({
          where: {
            domainName: dto.domainName,
            NOT: { id },
          },
        });

        if (duplicate) {
          await this.audit.create({
            performerType: role.name,
            performerId: currentUser.id,
            targetUserType: 'USER',
            targetUserId: existing.userId,
            action: 'UPDATE_IP_WHITELIST',
            description: 'Duplicate domainName detected on update',
            resourceType: 'IpWhitelist',
            resourceId: id,
            status: AuditStatus.FAILED,
            metadata: { reason: 'Duplicate domainName' },
          } satisfies CreateAuditLogDto);

          throw new ConflictException('domainName already exists');
        }
      }

      const updateData: IpWhitelistUpdateFields = {};
      if (dto.domainName !== undefined) updateData.domainName = dto.domainName;
      if (dto.serverIp !== undefined) updateData.serverIp = dto.serverIp;
      if (dto.userId !== undefined) updateData.userId = dto.userId;
      if (dto.rootId !== undefined) updateData.rootId = dto.rootId;

      const updated = await this.prisma.ipWhitelist.update({
        where: { id },
        data: updateData,
      });

      await this.audit.create({
        performerType: role.name,
        performerId: currentUser.id,
        targetUserType: 'USER',
        targetUserId: existing.userId,
        action: 'UPDATE_IP_WHITELIST',
        description: 'Updated IP whitelist entry',
        resourceType: 'IpWhitelist',
        resourceId: id,
        oldData: { ...existing },
        newData: { ...updateData },
        status: AuditStatus.SUCCESS,
      } satisfies CreateAuditLogDto);

      return updated as IpWhitelistType;
    } catch (err: any) {
      const message =
        err instanceof Error ? err.message : 'Failed to update ip whitelist';

      throw new InternalServerErrorException(message);
    }
  }

  /** REMOVE */
  async remove(id: string, currentUser: AuthActor): Promise<{ id: string }> {
    if (!currentUser) throw new UnauthorizedException('Invalid user');
    if (!id) throw new BadRequestException('id is required');

    const role = await this.validateRole(currentUser);

    try {
      const existing = await this.prisma.ipWhitelist.findUnique({
        where: { id },
      });

      if (!existing) {
        await this.audit.create({
          performerType: role.name,
          performerId: currentUser.id,
          targetUserType: 'USER',
          targetUserId: id,
          action: 'DELETE_IP_WHITELIST',
          description: 'IP whitelist not found for delete',
          resourceType: 'IpWhitelist',
          resourceId: id,
          status: AuditStatus.FAILED,
          metadata: { reason: 'NotFound' },
        } satisfies CreateAuditLogDto);

        throw new NotFoundException('IpWhitelist not found');
      }

      await this.prisma.ipWhitelist.delete({ where: { id } });

      await this.audit.create({
        performerType: role.name,
        performerId: currentUser.id,
        targetUserType: 'USER',
        targetUserId: existing.userId,
        action: 'DELETE_IP_WHITELIST',
        description: 'Deleted IP whitelist entry',
        resourceType: 'IpWhitelist',
        resourceId: id,
        oldData: { ...existing },
        status: AuditStatus.SUCCESS,
      } satisfies CreateAuditLogDto);

      return { id };
    } catch (err: any) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete ip whitelist';

      throw new InternalServerErrorException(message);
    }
  }

  /** ROLE VALIDATION */
  private async validateRole(currentUser: AuthActor) {
    const roleId = currentUser.roleId;
    if (!roleId) throw new BadRequestException('Invalid user role');

    const role = await this.prisma.role.findFirst({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException(`Role not found for roleId=${roleId}`);
    }

    return role;
  }
}
