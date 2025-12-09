import { Injectable, ForbiddenException } from '@nestjs/common';

import { PrismaService } from '../../../database/database.connection';

import { UpsertSystemSettingDto } from '../dto/upsert-system-setting.dto';

import { AuthActor } from '../../../auth/interface/auth.interface';
import { SystemSettingFileMap } from '../interfaces/system-setting.interface';

import { AuditLogService } from '../../audit-log/service/audit-log.service';

import { S3Service } from '../../../utils/s3/s3.service';
import { FileDeleteHelper } from '../../../utils/helper/file-delete-helper.service';

import { SettingScope } from '../enums/system-setting.enum';

@Injectable()
export class SystemSettingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly auditService: AuditLogService,
  ) {}

  // ================= UPSERT =================
  async upsert(
    actor: AuthActor,
    dto: UpsertSystemSettingDto,
    files?: Express.Multer.File[],
  ) {
    let uploadedLogo: string | null = null;
    let uploadedFavicon: string | null = null;

    const fileMap = this.mapFiles(files);

    try {
      // ---------- upload new files ----------
      uploadedLogo = await this.safeUpload(
        fileMap.companyLogo,
        'system-setting/logo',
      );

      uploadedFavicon = await this.safeUpload(
        fileMap.favIcon,
        'system-setting/favicon',
      );

      if (uploadedLogo) dto.companyLogo = uploadedLogo;
      if (uploadedFavicon) dto.favIcon = uploadedFavicon;

      // ---------- existing setting ----------
      const existing = await this.prisma.systemSetting.findUnique({
        where: {
          scope_rootId: {
            scope: dto.scope,
            rootId: await this.getRootId(actor),
          },
        },
      });

      // ---------- upsert ----------
      const updated = await this.prisma.systemSetting.upsert({
        where: {
          scope_rootId: {
            scope: dto.scope,
            rootId: await this.getRootId(actor),
          },
        },
        create: {
          ...dto,
          updatedBy: actor.id,
          rootId: await this.getRootId(actor),
        },
        update: {
          ...dto,
          updatedBy: actor.id,
        },
      });

      // ---------- delete old files ----------
      if (uploadedLogo && existing?.companyLogo) {
        await this.s3Service.delete({ fileUrl: existing.companyLogo });
      }

      if (uploadedFavicon && existing?.favIcon) {
        await this.s3Service.delete({ fileUrl: existing.favIcon });
      }

      return updated;
    } catch (err) {
      // rollback
      if (uploadedLogo) {
        await this.s3Service.delete({ fileUrl: uploadedLogo });
      }
      if (uploadedFavicon) {
        await this.s3Service.delete({ fileUrl: uploadedFavicon });
      }
      throw err;
    } finally {
      // ✅ always cleanup temp files
      FileDeleteHelper.deleteUploadedImages(files);
    }
  }

  // ================= GET BY ID =================
  async getById(actor: AuthActor, id: string) {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { id },
    });
    if (!setting) {
      throw new ForbiddenException('Setting not found');
    }
    if (setting.scope === SettingScope.ROOT) {
      if (actor.principalType === 'USER') {
        throw new ForbiddenException();
      }
      const rootId = await this.getRootId(actor);
      if (setting.rootId !== rootId) throw new ForbiddenException();
      return setting;
    }
    if (setting.scope === SettingScope.USER) {
      if (actor.principalType === 'ROOT') {
        throw new ForbiddenException();
      }
      const userId = await this.getUserId(actor);
      if (setting.userId !== userId) throw new ForbiddenException();
      return setting;
    }
    throw new ForbiddenException();
  }
  // ================= DELETE =================
  async delete(actor: AuthActor, id: string) {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { id },
    });
    if (!setting) {
      throw new ForbiddenException('Setting not found');
    }
    if (setting.scope === SettingScope.ROOT) {
      if (actor.principalType !== 'ROOT') {
        throw new ForbiddenException('Employee cannot delete');
      }
      const rootId = await this.getRootId(actor);
      if (setting.rootId !== rootId) throw new ForbiddenException();
      return this.prisma.systemSetting.delete({ where: { id } });
    }
    if (setting.scope === SettingScope.USER) {
      if (actor.principalType !== 'USER') {
        throw new ForbiddenException('Employee cannot delete');
      }
      const userId = await this.getUserId(actor);
      if (setting.userId !== userId) throw new ForbiddenException();
      return this.prisma.systemSetting.delete({ where: { id } });
    }
    throw new ForbiddenException();
  }

  // ================= GET ALL (USER ONLY) =================
  async getAll(actor: AuthActor, page = 1, limit = 10) {
    if (actor.principalType === 'ROOT') {
      throw new ForbiddenException('Root cannot access user settings');
    }
    const userId = await this.getUserId(actor);
    const take = Number(limit) || 10;
    const skip = (Number(page) - 1) * take;
    const [data, total] = await Promise.all([
      this.prisma.systemSetting.findMany({
        where: { scope: SettingScope.USER, userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.systemSetting.count({
        where: { scope: SettingScope.USER, userId },
      }),
    ]);
    return {
      data,
      pagination: {
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  // ================= HELPERS =================
  private async getRootId(actor: AuthActor): Promise<string> {
    if (actor.principalType === 'ROOT') return actor.id;

    if (actor.principalType === 'EMPLOYEE') {
      if (!actor.roleId) throw new ForbiddenException('RoleId missing');

      const dept = await this.prisma.department.findFirst({
        where: { id: actor.roleId },
        select: { createdByRootId: true },
      });

      if (!dept) throw new ForbiddenException('Department not found');
      return dept.createdByRootId;
    }

    throw new ForbiddenException();
  }

  private async getUserId(actor: AuthActor): Promise<string> {
    if (actor.principalType === 'USER') return actor.id;

    if (actor.principalType === 'EMPLOYEE') {
      if (!actor.roleId) throw new ForbiddenException('RoleId missing');

      const dept = await this.prisma.department.findFirst({
        where: { id: actor.roleId },
        select: { createdByUserId: true },
      });

      if (!dept) throw new ForbiddenException('Department not found');
      return dept.createdByUserId;
    }

    throw new ForbiddenException();
  }

  private mapFiles(files?: Express.Multer.File[]): SystemSettingFileMap {
    const map: SystemSettingFileMap = {
      companyLogo: null,
      favIcon: null,
    };

    files?.forEach((file) => {
      if (file.fieldname === 'companyLogo') {
        map.companyLogo = file;
      }

      if (file.fieldname === 'favIcon') {
        map.favIcon = file;
      }
    });

    return map;
  }

  private async safeUpload(
    file?: Express.Multer.File | null,
    prefix = '',
  ): Promise<string | null> {
    if (!file || !this.s3Service) return null;
    return this.s3Service.upload(file.path, prefix);
  }
}
