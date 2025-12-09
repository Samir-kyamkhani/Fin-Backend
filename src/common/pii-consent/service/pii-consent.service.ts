import {
  Injectable,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/database.connection';

import { CryptoService } from '../../../utils/crypto/crypto.service';
import { AuditLogService } from '../../audit-log/service/audit-log.service';

import { CreatePiiConsentDto } from '../dto/create-pii-consent.dto';
import { UpdatePiiConsentDto } from '../dto/update-pii-consent.dto';
import { CreateAuditLogDto } from '../../audit-log/dto/create-audit-log.dto';

import { AuditStatus } from '../../audit-log/enums/audit-log.enum';

import {
  PiiConsentCreateFields,
  PiiConsentType,
  PiiConsentUpdateFields,
} from '../interfaces/pii-consent.interface';
import { AuthActor } from '../../../auth/interface/auth.interface';

@Injectable()
export class PiiConsentService {
  constructor(
    private prisma: PrismaService,
    private crypto: CryptoService,
    private audit: AuditLogService,
  ) {}

  // CREATE
  async create(
    payload: CreatePiiConsentDto | CreatePiiConsentDto[],
    currentUser: AuthActor,
  ) {
    if (!currentUser) {
      throw new UnauthorizedException('Invalid user');
    }

    const items = Array.isArray(payload) ? payload : [payload];

    try {
      const results: PiiConsentType[] = [];

      for (const item of items) {
        const { userId, piiType, scope, piiHash, businessKycId, userKycId } =
          item;

        if (!userId || !piiType || !scope || !piiHash) {
          throw new BadRequestException(
            'userId, piiType, scope and piiHash are required',
          );
        }

        const existing = await this.prisma.piiConsent.findFirst({
          where: { userId, piiType, scope },
        });

        // role validation
        const role = await this.validateRole(currentUser);

        if (existing) {
          await this.audit.create({
            performerType: role.name,
            performerId: currentUser.id,
            targetUserType: 'USER',
            targetUserId: userId,
            action: 'CREATE_PII_CONSENT',
            description: 'Duplicate PII Consent detected',
            resourceType: 'PiiConsent',
            resourceId: existing.id,
            status: AuditStatus.FAILED,
            metadata: { reason: 'Duplicate PII' },
          } satisfies CreateAuditLogDto);

          throw new ConflictException('PII Consent already exists');
        }

        const encrypted = this.crypto.encrypt(piiHash);

        const data: PiiConsentCreateFields = {
          userId,
          piiType,
          scope,
          piiHash: encrypted,
          businessKycId: businessKycId,
          userKycId: userKycId,
          providedAt: new Date(),
          expiresAt: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
        };

        const newConsent = await this.prisma.piiConsent.create({
          data,
        });

        results.push(newConsent);

        await this.audit.create({
          performerType: role.name,
          performerId: currentUser.id,
          targetUserType: 'USER',
          targetUserId: userId,
          action: 'CREATE_PII_CONSENT',
          description: 'Created PII Consent',
          resourceType: 'PiiConsent',
          resourceId: newConsent.id,
          newData: data,
          status: AuditStatus.SUCCESS,
        } satisfies CreateAuditLogDto);
      }

      return Array.isArray(payload) ? results : results[0];
    } catch (err: unknown) {
      throw new InternalServerErrorException(
        err instanceof Error ? err.message : 'Unknown error',
      );
    }
  }

  // UPDATE
  async update(
    payload: UpdatePiiConsentDto | UpdatePiiConsentDto[],
    currentUser: AuthActor,
  ) {
    if (!currentUser) throw new UnauthorizedException('Invalid user');

    const items = Array.isArray(payload) ? payload : [payload];

    try {
      const results: PiiConsentType[] = [];

      for (const item of items) {
        const { id, piiType, scope, piiHash, businessKycId, userKycId } = item;

        if (!id) throw new BadRequestException('PII Consent ID is required');

        const existing = await this.prisma.piiConsent.findUnique({
          where: { id },
        });

        if (!existing) throw new NotFoundException('PII Consent not found');

        const duplicate = await this.prisma.piiConsent.findFirst({
          where: {
            userId: existing.userId,
            piiType: piiType || existing.piiType,
            scope: scope || existing.scope,
            NOT: { id },
          },
        });

        const role = await this.validateRole(currentUser);

        if (duplicate) {
          await this.audit.create({
            performerType: role.name,
            performerId: currentUser.id,
            targetUserType: 'USER',
            targetUserId: existing.userId,
            action: 'UPDATE_PII_CONSENT',
            description: 'Duplicate PII Consent detected',
            resourceType: 'PiiConsent',
            resourceId: id,
            status: AuditStatus.FAILED,
            metadata: { reason: 'Duplicate PII' },
          } satisfies CreateAuditLogDto);

          throw new ConflictException('Duplicate PII Consent exists');
        }

        const updateData: PiiConsentUpdateFields = {};
        if (piiType !== undefined) updateData.piiType = piiType;
        if (scope !== undefined) updateData.scope = scope;
        if (piiHash !== undefined)
          updateData.piiHash = this.crypto.encrypt(piiHash);
        if (businessKycId !== undefined)
          updateData.businessKycId = businessKycId;
        if (userKycId !== undefined) updateData.userKycId = userKycId;

        const updated = await this.prisma.piiConsent.update({
          where: { id },
          data: updateData,
        });

        results.push(updated);

        await this.audit.create({
          performerType: role.name,
          performerId: currentUser.id,
          targetUserType: 'USER',
          targetUserId: existing.userId,
          action: 'UPDATE_PII_CONSENT',
          description: 'Updated PII Consent',
          resourceType: 'PiiConsent',
          resourceId: id,
          oldData: { ...existing },
          newData: { ...updateData },
          status: AuditStatus.SUCCESS,
        } satisfies CreateAuditLogDto);
      }

      return Array.isArray(payload) ? results : results[0];
    } catch (err: unknown) {
      throw new InternalServerErrorException(
        err instanceof Error ? err.message : 'Unknown error',
      );
    }
  }

  // DELETE
  async delete(id: string, currentUser: AuthActor) {
    if (!currentUser) throw new UnauthorizedException('Invalid user');

    try {
      const existing = await this.prisma.piiConsent.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException('PII Consent not found');
      }

      const role = await this.validateRole(currentUser);

      await this.prisma.piiConsent.delete({ where: { id } });

      await this.audit.create({
        performerType: role.name,
        performerId: currentUser.id,
        targetUserType: 'USER',
        targetUserId: existing.userId,
        action: 'DELETE_PII_CONSENT',
        description: 'Deleted PII Consent',
        resourceType: 'PiiConsent',
        resourceId: id,
        oldData: { ...existing },
        status: AuditStatus.SUCCESS,
      } satisfies CreateAuditLogDto);

      return { message: 'PII Consent deleted successfully' };
    } catch (err: unknown) {
      throw new InternalServerErrorException(
        err instanceof Error ? err.message : 'Unknown error',
      );
    }
  }

  // ROLE VALIDATION (Reusable)
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
