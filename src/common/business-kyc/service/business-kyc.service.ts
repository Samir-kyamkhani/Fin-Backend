import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  BusinessKyc,
  BusinessKycWithRelations,
  CreateBusinessKycData,
  UpdateBusinessKycData,
  BusinessKycResponse,
  FileMap,
  VerifyBusinessKycData,
} from '../interfaces/business-kyc.interface';

import { KycStatus, SortOrder } from '../enums/business-kyc.enum';
import { AuditStatus } from '../../audit-log/enums/audit-log.enum';

import { FileDeleteHelper } from '../../../utils/helper/file-delete-helper.service';
import { S3Service } from '../../../utils/s3/s3.service';
import { CryptoService } from '../../../utils/crypto/crypto.service';
import { AddressService } from '../../address/service/address.service';
import { PiiConsentService } from '../../pii-consent/service/pii-consent.service';
import { AuditLogService } from '../../audit-log/service/audit-log.service';

import { PrismaService } from '../../../database/database.connection';

import { CreateBusinessKycDto } from '../dto/create-business-kyc.dto';
import { CreateAuditLogDto } from '../../audit-log/dto/create-audit-log.dto';
import { UpdateBusinessKycDto } from '../dto/update-business-kyc.dto';
import { VerifyBusinessKycDto } from '../dto/verify-business-kyc.dto';
import { BusinessKycQueryDto } from '../dto/business-kyc-query.dto';

import { AuthActor } from '../../../auth/interface/auth.interface';
import { AddressCreateFields } from '../../address/interfaces/address.interface';
import { PiiConsentCreateFields } from '../../pii-consent/interfaces/pii-consent.interface';

import { Prisma } from '../../../../generated/prisma/client';

@Injectable()
export class BusinessKycService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly piiService: PiiConsentService,
    private readonly cryptoService: CryptoService,
    private readonly auditService: AuditLogService,
    private readonly addressService: AddressService,
    private readonly s3Service?: S3Service,
  ) {}

  // ---------------- GET ALL ----------------
  async getAll(
    query: BusinessKycQueryDto,
    currentUser: AuthActor,
  ): Promise<{
    data: BusinessKycWithRelations[];
    pagination: {
      page: number;
      limit: number;
      total: number;
    };
  }> {
    if (!currentUser?.id) {
      throw new BadRequestException('Invalid user');
    }

    const {
      page = 1,
      limit = 10,
      status,
      search,
      sort = SortOrder.DESC,
    } = query;

    const where: Prisma.BusinessKycWhereInput = {};
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { businessName: { contains: search } },
        { cin: { contains: search } },
        {
          piiConsents: {
            some: {
              piiHash: { contains: this.cryptoService.encrypt(search) },
            },
          },
        },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.businessKyc.findMany({
        where,
        include: {
          address: { include: { city: true, state: true } },
          piiConsents: true,
        },
        orderBy: { createdAt: sort as Prisma.SortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),

      this.prisma.businessKyc.count({ where }),
    ]);

    return {
      data: data as unknown as BusinessKycWithRelations[],
      pagination: { page, limit, total },
    };
  }

  // ---------------- CREATE ----------------
  async create(
    dto: CreateBusinessKycDto,
    currentUser?: AuthActor,
    files?: Express.Multer.File[],
  ): Promise<BusinessKyc> {
    if (!currentUser?.id) {
      throw new BadRequestException('Invalid user');
    }

    const userId = currentUser.id;
    const role = await this.validateRole(currentUser);

    const fileMap = this.mapFiles(files);

    try {
      // Check Duplicate
      const exists = await this.prisma.businessKyc.findFirst({
        where: { userId },
      });
      if (exists) {
        throw new ConflictException('Business KYC already exists');
      }

      // Create Address
      const addressData: AddressCreateFields = {
        address: dto.address,
        pinCode: dto.pinCode,
        cityId: dto.cityId,
        stateId: dto.stateId,
      };
      const address = await this.addressService.create(
        addressData,
        currentUser,
      );

      // Upload to S3 (if available) — safely check each file
      const panFileUrl = await this.safeUpload(fileMap.panFile, 'business/pan');
      const gstFileUrl = await this.safeUpload(fileMap.gstFile, 'business/gst');
      const moaFileUrl = await this.safeUpload(fileMap.moaFile, 'business/moa');
      const aoaFileUrl = await this.safeUpload(fileMap.aoaFile, 'business/aoa');

      // Create Business KYC
      const kycData: CreateBusinessKycData = {
        userId,
        businessName: dto.businessName,
        businessType: dto.businessType,
        addressId: address.id,
        panFile: panFileUrl || '',
        gstFile: gstFileUrl || '',
        moaFile: moaFileUrl ?? null,
        aoaFile: aoaFileUrl ?? null,
        cin: dto.cin || null,
        partnerKycNumbers: dto.partnerKycNumbers ?? null,
        authorizedMemberCount: dto.authorizedMemberCount,

        brDoc: null,
        partnershipDeed: null,
        directorShareholding: null,
      };

      const kyc = await this.prisma.businessKyc.create({
        data: kycData,
        include: {
          user: {
            select: {
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      // PII Consent Store
      const piiPayloads: PiiConsentCreateFields[] = [
        {
          userId,
          piiType: 'PAN',
          piiHash: this.cryptoService.encrypt(dto.pan),
          scope: 'BUSINESS_KYC',
          businessKycId: kyc.id,
          providedAt: new Date(),
          expiresAt: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
        },
        {
          userId,
          piiType: 'GST',
          piiHash: this.cryptoService.encrypt(dto.gst),
          scope: 'BUSINESS_KYC',
          businessKycId: kyc.id,
          providedAt: new Date(),
          expiresAt: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
        },
      ];

      if (dto.udhyamAadhar) {
        piiPayloads.push({
          userId,
          piiType: 'UDHYAM',
          piiHash: this.cryptoService.encrypt(dto.udhyamAadhar),
          scope: 'BUSINESS_KYC',
          businessKycId: kyc.id,
          providedAt: new Date(),
          expiresAt: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
        });
      }

      await this.piiService.create(piiPayloads, currentUser);

      // Audit Log
      await this.auditService.create({
        performerType: role.name,
        performerId: currentUser.id,
        targetUserType: kyc.user.role.name || 'USER',
        targetUserId: userId,
        action: 'CREATE_BUSINESS_KYC',
        description: 'Business KYC created',
        resourceType: 'BusinessKyc',
        resourceId: kyc.id,
        newData: { ...dto },
        status: AuditStatus.SUCCESS,
      } satisfies CreateAuditLogDto);

      return kyc as BusinessKyc;
    } catch (error) {
      FileDeleteHelper.deleteUploadedImages(files);
      throw error;
    } finally {
      FileDeleteHelper.deleteUploadedImages(files);
    }
  }

  // ---------------- GET BY USER ID ----------------
  async getByUserId(id: string): Promise<BusinessKycResponse> {
    const kyc = await this.prisma.businessKyc.findFirst({
      where: { id },
      include: {
        address: {
          include: { city: true, state: true },
        },
        piiConsents: true,
      },
    });

    if (!kyc) {
      throw new NotFoundException('Business KYC not found');
    }

    const pii = (kyc.piiConsents || []).map((p) => {
      const decrypted = this.cryptoService.decrypt(p.piiHash);
      const masked =
        p.piiType === 'PAN'
          ? this.cryptoService.maskPAN(decrypted)
          : this.cryptoService.maskPhone(decrypted);

      return {
        type: p.piiType,
        value: decrypted,
        masked,
      };
    });

    return {
      kyc: kyc as BusinessKycWithRelations,
      pii,
    };
  }

  // ---------------- UPDATE ----------------
  async update(
    id: string,
    dto: UpdateBusinessKycDto,
    currentUser?: AuthActor,
    files?: Express.Multer.File[],
  ): Promise<BusinessKyc> {
    if (!currentUser?.id) {
      throw new BadRequestException('Invalid user');
    }

    const role = await this.validateRole(currentUser);

    const existing = await this.prisma.businessKyc.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Business KYC not found');
    }

    const fileMap = this.mapFiles(files);

    try {
      const updateData: UpdateBusinessKycData = {};

      // Handle file updates with S3 (delete old, upload new)
      if (fileMap.panFile && this.s3Service) {
        if (existing.panFile) {
          await this.s3Service.delete({ fileUrl: existing.panFile });
        }
        const url = await this.s3Service.upload(
          fileMap.panFile.path,
          'business/pan',
        );
        updateData.panFile = url || '';
      }

      if (fileMap.gstFile && this.s3Service) {
        if (existing.gstFile) {
          await this.s3Service.delete({ fileUrl: existing.gstFile });
        }
        const url = await this.s3Service.upload(
          fileMap.gstFile.path,
          'business/gst',
        );
        updateData.gstFile = url || '';
      }

      if (fileMap.moaFile && this.s3Service) {
        if (existing.moaFile) {
          await this.s3Service.delete({ fileUrl: existing.moaFile });
        }
        updateData.moaFile =
          (await this.s3Service.upload(fileMap.moaFile.path, 'business/moa')) ??
          null;
      }

      if (fileMap.aoaFile && this.s3Service) {
        if (existing.aoaFile) {
          await this.s3Service.delete({ fileUrl: existing.aoaFile });
        }
        updateData.aoaFile =
          (await this.s3Service.upload(fileMap.aoaFile.path, 'business/aoa')) ??
          null;
      }

      // Update basic fields
      if (dto.businessName !== undefined)
        updateData.businessName = dto.businessName;
      if (dto.businessType !== undefined)
        updateData.businessType = dto.businessType;
      if (dto.cin !== undefined) updateData.cin = dto.cin;
      if (dto.partnerKycNumbers !== undefined)
        updateData.partnerKycNumbers = dto.partnerKycNumbers;
      if (dto.authorizedMemberCount !== undefined)
        updateData.authorizedMemberCount = dto.authorizedMemberCount;

      const updated = await this.prisma.businessKyc.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      // Update address if needed
      if (dto.address || dto.pinCode || dto.cityId || dto.stateId) {
        const addressUpdateData = {
          address: dto.address,
          pinCode: dto.pinCode,
          cityId: dto.cityId,
          stateId: dto.stateId,
        };
        await this.addressService.update(
          existing.addressId,
          addressUpdateData,
          currentUser,
        );
      }

      // Update PII if needed
      if (dto.pan || dto.gst || dto.udhyamAadhar) {
        await this.piiService.update(dto, currentUser);
      }

      // Audit Log
      const auditLogData: CreateAuditLogDto = {
        performerType: role.name,
        performerId: currentUser.id,
        targetUserType: updated.user.role.name || 'USER',
        targetUserId: currentUser.id,
        action: 'UPDATE_BUSINESS_KYC',
        description: 'Business KYC updated',
        resourceType: 'BusinessKyc',
        resourceId: id,
        newData: dto,
        status: AuditStatus.SUCCESS,
      };
      await this.auditService.create(auditLogData);

      return updated as BusinessKyc;
    } catch (error) {
      FileDeleteHelper.deleteUploadedImages(files);
      throw error;
    } finally {
      FileDeleteHelper.deleteUploadedImages(files);
    }
  }

  // ---------------- DELETE ----------------
  async delete(
    kycId: string,
    currentUser: AuthActor,
  ): Promise<{ message: string }> {
    const role = await this.validateRole(currentUser);

    const kyc = await this.prisma.businessKyc.findUnique({
      where: { id: kycId },
    });

    if (!kyc) {
      throw new NotFoundException('Business KYC not found');
    }

    // Delete from database
    const deleted = await this.prisma.businessKyc.delete({
      where: { id: kycId },
      include: {
        user: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Delete associated PII consents
    await this.piiService.delete(kycId, currentUser);

    // Audit Log
    const auditLogData: CreateAuditLogDto = {
      performerType: role.name,
      performerId: currentUser.id,
      targetUserType: deleted.user.role.name || 'USER',
      targetUserId: kyc.userId,
      action: 'DELETE_BUSINESS_KYC',
      description: 'Business KYC deleted',
      resourceType: 'BusinessKyc',
      resourceId: kycId,
      oldData: kyc as unknown as object,
      status: AuditStatus.SUCCESS,
    };
    await this.auditService.create(auditLogData);

    return { message: 'Business KYC deleted successfully' };
  }

  // ---------------- VERIFY ----------------
  async verify(
    kycId: string,
    dto: VerifyBusinessKycDto,
    currentUser: AuthActor,
  ): Promise<BusinessKyc> {
    const role = await this.validateRole(currentUser);

    const kyc = await this.prisma.businessKyc.findUnique({
      where: { id: kycId },
    });

    if (!kyc) {
      throw new NotFoundException('Business KYC not found');
    }

    const verifyData: VerifyBusinessKycData = {
      status: dto.status,
      rejectionReason:
        dto.status === KycStatus.REJECTED ? dto.rejectionReason : undefined,
      verifiedAt: dto.status === KycStatus.VERIFIED ? new Date() : undefined,
      verifiedByEmployeeId: currentUser.id,
      verifiedByType: role.name,
    };

    const updated = await this.prisma.businessKyc.update({
      where: { id: kycId },
      data: verifyData,
      include: {
        user: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Audit Log
    const auditLogData: CreateAuditLogDto = {
      performerType: role.name,
      performerId: currentUser.id,
      targetUserType: updated.user.role.name || 'USER',
      targetUserId: kyc.userId,
      action: 'VERIFY_BUSINESS_KYC',
      description: `Business KYC marked as ${dto.status}`,
      resourceType: 'BusinessKyc',
      resourceId: kycId,
      newData: dto,
      status: AuditStatus.SUCCESS,
    };
    await this.auditService.create(auditLogData);

    return updated as BusinessKyc;
  }

  // ---------------- PRIVATE METHODS ----------------
  private async validateRole(
    currentUser?: AuthActor,
  ): Promise<{ id: string; name: string }> {
    if (!currentUser?.roleId) {
      throw new BadRequestException('Invalid user role');
    }

    const role = await this.prisma.role.findUnique({
      where: { id: currentUser.roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  private mapFiles(files?: Express.Multer.File[] | null): FileMap {
    // initialize with null to avoid 'any' and make keys explicit
    const map: FileMap = {
      panFile: null,
      gstFile: null,
      udhyamAadhar: null,
      moaFile: null,
      aoaFile: null,
    };

    if (!files || !Array.isArray(files)) {
      return map;
    }

    for (const file of files) {
      if (!file || !file.fieldname) continue;
      const key = file.fieldname as keyof FileMap;
      if (Object.prototype.hasOwnProperty.call(map, key)) {
        map[key] = file;
      }
    }

    return map;
  }

  private async safeUpload(
    file?: Express.Multer.File | null,
    keyPrefix = '',
  ): Promise<string | null> {
    if (!file || !this.s3Service) return null;
    if (typeof file.path !== 'string') {
      return null;
    }

    return this.s3Service.upload(file.path, keyPrefix);
  }
}
