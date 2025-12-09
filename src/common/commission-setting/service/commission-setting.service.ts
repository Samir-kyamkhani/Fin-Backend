import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/database.connection';
import { CommissionSettingQueryDto } from '../dto/commission-setting-query.dto';
import { AccessContext } from '../interfaces/access-context.interface';

@Injectable()
export class CommissionSettingService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: CommissionSettingQueryDto, ctx: AccessContext) {
    const page = Math.max(query.page || 1, 1);
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {
      createdByRootId: ctx.rootId,
    };

    if (ctx.mode === 'ADMIN') {
      where.createdByUserId = ctx.ownerId;
    }

    if (query.scope) where.scope = query.scope;
    if (query.roleId) where.roleId = query.roleId;
    if (query.targetUserId) where.targetUserId = query.targetUserId;
    if (query.serviceId) where.serviceId = query.serviceId;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    const [data, total] = await Promise.all([
      this.prisma.commissionSetting.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.commissionSetting.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
