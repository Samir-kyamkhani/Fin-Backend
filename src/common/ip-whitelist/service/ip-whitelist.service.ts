import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/database.connection';

import {
  IpWhitelistUserType,
  IpWhitelistRootType,
  IpWhitelistCreateUserFields,
  IpWhitelistCreateRootFields,
  IpWhitelistUpdateUserFields,
  IpWhitelistUpdateRootFields,
  IpWhitelistTypeMap,
} from '../types/ip-whitelist.type';

import { CreateUserIpWhitelistDto } from '../dto/create-user-ip-whitelist.dto';
import { CreateRootIpWhitelistDto } from '../dto/create-root-ip-whitelist.dto';
import { UpdateUserIpWhitelistDto } from '../dto/update-user-ip-whitelist.dto';
import { UpdateRootIpWhitelistDto } from '../dto/update-root-ip-whitelist.dto';

import { AuditLogService } from '../../audit-log/service/audit-log.service';
import { AuditStatus } from '../../audit-log/enums/audit-log.enum';
import { CreateAuditLogDto } from '../../audit-log/dto/create-audit-log.dto';

import { Prisma } from '../../../../generated/prisma/client';
import { AuthActor } from '../../../auth/interface/auth.interface';
import { IpWhitelist } from '../../../../generated/prisma/browser';

@Injectable()
export class IpWhitelistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

  private ensureUser(currentUser: AuthActor) {
    if (!currentUser) throw new UnauthorizedException('Invalid user');
  }

  private async validateRole(currentUser: AuthActor) {
    const role = await this.prisma.role.findUnique({
      where: { id: currentUser.roleId! },
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  private mapFullDataUser(row: IpWhitelist): IpWhitelistUserType {
    return {
      id: row.id,
      domainName: row.domainName,
      serverIp: row.serverIp,
      userId: row.userId as string,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private mapRoot(row: {
    domainName: string;
    serverIp: string;
  }): IpWhitelistTypeMap {
    return {
      domainName: row.domainName,
      serverIp: row.serverIp,
    };
  }

  private mapUser(row: {
    domainName: string;
    serverIp: string;
  }): IpWhitelistTypeMap {
    return {
      domainName: row.domainName,
      serverIp: row.serverIp,
    };
  }

  private mapFullDataRoot(row: IpWhitelist): IpWhitelistRootType {
    return {
      id: row.id,
      domainName: row.domainName,
      serverIp: row.serverIp,
      rootId: row.rootId as string,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private async auditLog(data: CreateAuditLogDto) {
    return this.audit.create(data);
  }

  async createForUser(
    dto: CreateUserIpWhitelistDto,
    currentUser: AuthActor,
  ): Promise<IpWhitelistUserType> {
    this.ensureUser(currentUser);
    const role = await this.validateRole(currentUser);

    try {
      const exists = await this.prisma.ipWhitelist.findFirst({
        where: { domainName: dto.domainName, userId: dto.userId },
      });

      if (exists) {
        await this.auditLog({
          performerType: role.name,
          performerId: currentUser.id,
          targetUserType: 'USER',
          targetUserId: dto.userId,
          action: 'CREATE_USER_WHITELIST',
          description: 'Duplicate domain for user',
          resourceType: 'IpWhitelist',
          resourceId: exists.id,
          status: AuditStatus.FAILED,
          metadata: { reason: 'Duplicate domainName' },
        });
        throw new ConflictException('domainName already exists');
      }

      const data: IpWhitelistCreateUserFields = {
        domainName: dto.domainName,
        serverIp: dto.serverIp,
        userId: dto.userId,
      };

      const created = await this.prisma.ipWhitelist.create({ data });

      await this.auditLog({
        performerType: role.name,
        performerId: currentUser.id,
        targetUserType: 'USER',
        targetUserId: dto.userId,
        action: 'CREATE_USER_WHITELIST',
        description: 'Created user whitelist entry',
        resourceType: 'IpWhitelist',
        resourceId: created.id,
        newData: created,
        status: AuditStatus.SUCCESS,
      });

      return this.mapFullDataUser(created);
    } catch (err) {
      throw new InternalServerErrorException(
        err instanceof Error ? err.message : 'Failed to create whitelist',
      );
    }
  }

  async createForRoot(
    dto: CreateRootIpWhitelistDto,
    currentUser: AuthActor,
  ): Promise<IpWhitelistRootType> {
    this.ensureUser(currentUser);
    const role = await this.validateRole(currentUser);

    try {
      const exists = await this.prisma.ipWhitelist.findFirst({
        where: { domainName: dto.domainName, rootId: dto.rootId },
      });

      if (exists) {
        await this.auditLog({
          performerType: role.name,
          performerId: currentUser.id,
          targetUserType: 'ROOT',
          targetUserId: dto.rootId,
          action: 'CREATE_ROOT_WHITELIST',
          description: 'Duplicate domain for root',
          resourceType: 'IpWhitelist',
          resourceId: exists.id,
          status: AuditStatus.FAILED,
          metadata: { reason: 'Duplicate domainName' },
        });
        throw new ConflictException('domainName already exists');
      }

      const data: IpWhitelistCreateRootFields = {
        domainName: dto.domainName,
        serverIp: dto.serverIp,
        rootId: dto.rootId,
      };

      const created = await this.prisma.ipWhitelist.create({ data });

      await this.auditLog({
        performerType: role.name,
        performerId: currentUser.id,
        targetUserType: 'ROOT',
        targetUserId: dto.rootId,
        action: 'CREATE_ROOT_WHITELIST',
        description: 'Created root whitelist entry',
        resourceType: 'IpWhitelist',
        resourceId: created.id,
        newData: created,
        status: AuditStatus.SUCCESS,
      });

      return this.mapFullDataRoot(created);
    } catch (err) {
      throw new InternalServerErrorException(
        err instanceof Error ? err.message : 'Failed to create whitelist',
      );
    }
  }

  async findAll(filters?: {
    userId?: string;
    rootId?: string;
    search?: string;
  }) {
    const where: Prisma.IpWhitelistWhereInput = {};

    if (filters?.userId) where.userId = filters.userId;
    if (filters?.rootId) where.rootId = filters.rootId;

    if (filters?.search) {
      const q = filters.search;
      where.OR = [
        { domainName: { contains: q } },
        { serverIp: { contains: q } },
      ];
    }

    return this.prisma.ipWhitelist.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findUserWhitelist(userId: string): Promise<IpWhitelistTypeMap[]> {
    const row = await this.prisma.ipWhitelist.findMany({
      where: { userId },
      select: {
        domainName: true,
        serverIp: true,
      },
    });

    if (!row.length) throw new NotFoundException('User whitelist not found');

    return row.map((r) => this.mapUser(r));
  }

  async findRootWhitelist(rootId: string): Promise<IpWhitelistTypeMap[]> {
    const row = await this.prisma.ipWhitelist.findMany({
      where: { rootId },
      select: {
        domainName: true,
        serverIp: true,
      },
    });

    if (!row.length) throw new NotFoundException('Root whitelist not found');

    return row.map((r) => this.mapRoot(r));
  }

  async updateForUser(
    id: string,
    dto: UpdateUserIpWhitelistDto,
    currentUser: AuthActor,
  ): Promise<IpWhitelistUserType> {
    this.ensureUser(currentUser);
    const role = await this.validateRole(currentUser);

    const row = await this.prisma.ipWhitelist.findUnique({ where: { id } });
    if (!row || !row.userId)
      throw new NotFoundException('User whitelist not found');

    if (dto.domainName) {
      const duplicate = await this.prisma.ipWhitelist.findFirst({
        where: {
          domainName: dto.domainName,
          userId: row.userId,
          NOT: { id },
        },
      });
      if (duplicate) throw new ConflictException('domainName already exists');
    }

    const updated = await this.prisma.ipWhitelist.update({
      where: { id },
      data: dto as IpWhitelistUpdateUserFields,
    });

    await this.auditLog({
      performerType: role.name,
      performerId: currentUser.id,
      targetUserType: 'USER',
      targetUserId: row.userId,
      action: 'UPDATE_USER_WHITELIST',
      description: 'Updated user whitelist entry',
      resourceType: 'IpWhitelist',
      resourceId: id,
      oldData: row,
      newData: updated,
      status: AuditStatus.SUCCESS,
    });

    return this.mapFullDataUser(updated);
  }

  async updateForRoot(
    id: string,
    dto: UpdateRootIpWhitelistDto,
    currentUser: AuthActor,
  ): Promise<IpWhitelistRootType> {
    this.ensureUser(currentUser);
    const role = await this.validateRole(currentUser);

    const row = await this.prisma.ipWhitelist.findUnique({ where: { id } });
    if (!row || !row.rootId)
      throw new NotFoundException('Root whitelist not found');

    if (dto.domainName) {
      const duplicate = await this.prisma.ipWhitelist.findFirst({
        where: {
          domainName: dto.domainName,
          rootId: row.rootId,
          NOT: { id },
        },
      });
      if (duplicate) throw new ConflictException('domainName already exists');
    }

    const updated = await this.prisma.ipWhitelist.update({
      where: { id },
      data: dto as IpWhitelistUpdateRootFields,
    });

    await this.auditLog({
      performerType: role.name,
      performerId: currentUser.id,
      targetUserType: 'ROOT',
      targetUserId: row.rootId,
      action: 'UPDATE_ROOT_WHITELIST',
      description: 'Updated root whitelist entry',
      resourceType: 'IpWhitelist',
      resourceId: id,
      oldData: row,
      newData: updated,
      status: AuditStatus.SUCCESS,
    });

    return this.mapFullDataRoot(updated);
  }

  async remove(id: string, currentUser: AuthActor): Promise<{ id: string }> {
    this.ensureUser(currentUser);
    const role = await this.validateRole(currentUser);

    const row = await this.prisma.ipWhitelist.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Whitelist not found');

    await this.prisma.ipWhitelist.delete({ where: { id } });

    await this.auditLog({
      performerType: role.name,
      performerId: currentUser.id,
      targetUserType: row.userId ? 'USER' : 'ROOT',
      targetUserId: (row.userId ?? row.rootId) as string,
      action: 'DELETE_WHITELIST',
      description: 'Deleted whitelist entry',
      resourceType: 'IpWhitelist',
      resourceId: id,
      oldData: row,
      status: AuditStatus.SUCCESS,
    });

    return { id };
  }
}
