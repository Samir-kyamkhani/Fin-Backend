import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../database/database.connection';

import { AddressService } from '../../address/service/address.service';
import { PiiConsentService } from '../../pii-consent/service/pii-consent.service';
import { AuditLogService } from '../../audit-log/service/audit-log.service';
import { S3Service } from '../../../utils/s3/s3.service';
import { FileDeleteHelper } from '../../../utils/helper/file-delete-helper.service';
import { CryptoService } from '../../../utils/crypto/crypto.service';

import { CreateUserKycDto } from '../dto/create-user-kyc.dto';
import { UpdateUserKycDto } from '../dto/update-user-kyc.dto';
import { VerifyUserKycDto } from '../dto/verify-user-kyc.dto';
import { GetAllUserKycDto } from '../dto/get-all-user-kyc.dto';

import { AuditStatus } from '../../audit-log/enums/audit-log.enum';
import { UserKycStatus } from '../enums/user-kyc.enum';

import {
  FileMap,
  CreateUserKycData,
  UpdateUserKycData,
  PaginatedKycResponse,
} from '../interfaces/user-kyc.interface';
import { PiiConsentCreateFields } from '../../pii-consent/interfaces/pii-consent.interface';
import { AuthActor } from '../../../auth/interface/auth.interface';

@Injectable()
export class UserKycService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly addressService: AddressService,
    private readonly piiService: PiiConsentService,
    private readonly cryptoService: CryptoService,
    private readonly auditService: AuditLogService,
    private readonly s3Service?: S3Service,
  ) {}

  // ===================================================================
  //  SINGLE API: GET ALL KYC WITH FULL HIERARCHY RULES
  // ===================================================================
  async getAllKyc(
    dto: GetAllUserKycDto,
    currentUser: AuthActor,
  ): Promise<PaginatedKycResponse> {
    const access = await this.getAccessibleScope(currentUser);

    // -------------------------------
    // PAGINATION
    // -------------------------------
    const page = dto.page && dto.page > 0 ? dto.page : 1;
    const limit = dto.limit && dto.limit > 0 ? dto.limit : 20;
    const skip = (page - 1) * limit;

    // -------------------------------
    // SEARCH CONDITIONS
    // -------------------------------
    const searchWhere = dto.search
      ? {
          OR: [
            { firstName: { contains: dto.search, mode: 'insensitive' } },
            { lastName: { contains: dto.search, mode: 'insensitive' } },
            { fatherName: { contains: dto.search, mode: 'insensitive' } },
            {
              user: {
                OR: [
                  { email: { contains: dto.search, mode: 'insensitive' } },
                  {
                    phoneNumber: { contains: dto.search, mode: 'insensitive' },
                  },
                  { customerId: { contains: dto.search, mode: 'insensitive' } },
                ],
              },
            },
          ],
        }
      : {};

    // -------------------------------
    // STATUS FILTER
    // -------------------------------
    const statusWhere = dto.status ? { status: dto.status } : {};

    // -------------------------------
    // ACCESS CONTROL
    // -------------------------------
    const scopeWhere = access.allRecords
      ? {}
      : {
          userId: { in: access.userIds },
        };

    // -------------------------------
    // FINAL WHERE CLAUSE
    // -------------------------------
    const where = {
      AND: [searchWhere, statusWhere, scopeWhere],
    };

    // -------------------------------
    // STATS
    // -------------------------------
    const [total, pending, verified, rejected] = await Promise.all([
      this.prisma.userKyc.count({ where }),
      this.prisma.userKyc.count({
        where: { AND: [where, { status: 'PENDING' }] },
      }),
      this.prisma.userKyc.count({
        where: { AND: [where, { status: 'VERIFIED' }] },
      }),
      this.prisma.userKyc.count({
        where: { AND: [where, { status: 'REJECTED' }] },
      }),
    ]);

    // -------------------------------
    // MAIN PAGINATED DATA
    // -------------------------------
    const kycs = await this.prisma.userKyc.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        address: { include: { city: true, state: true } },
        piiConsents: true,
        businessKyc: {
          include: {
            address: { include: { city: true, state: true } },
          },
        },
      },
    });

    // -------------------------------
    // FORMAT RESPONSE
    // -------------------------------
    const formatted = kycs.map((kyc) => {
      const pii = kyc.piiConsents.map((consent) => {
        const dec = this.cryptoService.decrypt(consent.piiHash);
        const masked =
          consent.piiType === 'PAN'
            ? dec.slice(0, 5) + '****' + dec.slice(-1)
            : 'XXXXXXXX' + dec.slice(-4);

        return {
          type: consent.piiType,
          value: dec,
          masked,
        };
      });

      return {
        ...kyc,
        user: {
          id: kyc.user.id,
          username: kyc.user.username,
          firstName: kyc.user.firstName,
          lastName: kyc.user.lastName,
          email: kyc.user.email,
          phoneNumber: kyc.user.phoneNumber,
          customerId: kyc.user.customerId,
        },
        pii,
      };
    });

    return {
      data: formatted,
      page,
      limit,
      total,

      stats: { total, pending, verified, rejected },
    };
  }

  // ===================================================================
  //  ROLE-BASED HIERARCHY ACCESS SYSTEM
  // ===================================================================
  private async getAccessibleScope(currentUser: AuthActor) {
    if (!currentUser?.id) {
      return { allRecords: false, userIds: [] };
    }

    const role = currentUser.roleId
      ? await this.prisma.role.findUnique({
          where: { id: currentUser.roleId },
          select: { name: true },
        })
      : null;

    const roleName = role?.name?.toUpperCase() ?? '';

    // EMPLOYEE INFO
    const employee = await this.prisma.employee.findFirst({
      where: { userId: currentUser.id },
      select: {
        createdByRootId: true,
        createdByUserId: true,
      },
    });

    // -----------------------------------------------------
    // EMPLOYEE CREATED BY ROOT → FULL ACCESS
    // -----------------------------------------------------
    if (employee?.createdByRootId) {
      return { allRecords: true, userIds: [] };
    }

    // -----------------------------------------------------
    // EMPLOYEE CREATED BY USER (Admin or Root)
    // -----------------------------------------------------
    if (employee?.createdByUserId) {
      const creator = await this.prisma.user.findUnique({
        where: { id: employee.createdByUserId },
        select: { id: true, roleId: true },
      });

      if (creator) {
        const creatorRole = creator.roleId
          ? await this.prisma.role.findUnique({
              where: { id: creator.roleId },
              select: { name: true },
            })
          : null;

        const creatorRoleName = creatorRole?.name?.toUpperCase() ?? '';

        // Root creator → FULL ACCESS
        if (creatorRoleName === 'ROOT') {
          return { allRecords: true, userIds: [] };
        }

        // Admin creator → FULL RECURSION
        if (creatorRoleName === 'ADMIN') {
          const ids = await this.collectDescendants([creator.id]);
          return { allRecords: false, userIds: ids };
        }
      }

      // fallback: regular user logic
      return await this.getTwoLevelChildren(currentUser.id);
    }

    // -----------------------------------------------------
    // ROOT → DIRECT CHILDREN ONLY
    // -----------------------------------------------------
    if (roleName === 'ROOT') {
      const children = await this.prisma.user.findMany({
        where: { parentId: currentUser.id },
        select: { id: true },
      });
      return {
        allRecords: false,
        userIds: children.map((c) => c.id),
      };
    }

    // -----------------------------------------------------
    // ADMIN → FULL RECURSIVE
    // -----------------------------------------------------
    if (roleName === 'ADMIN') {
      const ids = await this.collectDescendants([currentUser.id]);
      return { allRecords: false, userIds: ids };
    }

    // -----------------------------------------------------
    // REGULAR USER → only children + grandchildren
    // -----------------------------------------------------
    return await this.getTwoLevelChildren(currentUser.id);
  }

  // ===================================================================
  //  REGULAR USER → ONLY CHILDREN + GRANDCHILDREN
  // ===================================================================
  private async getTwoLevelChildren(userId: string) {
    const level1 = await this.prisma.user.findMany({
      where: { parentId: userId },
      select: { id: true },
    });

    const lvl1 = level1.map((u) => u.id);

    const level2 = await this.prisma.user.findMany({
      where: { parentId: { in: lvl1 } },
      select: { id: true },
    });

    const lvl2 = level2.map((u) => u.id);

    return {
      allRecords: false,
      userIds: [...lvl1, ...lvl2],
    };
  }

  // ===================================================================
  //  ADMIN → RECURSIVE CHILDREN FINDER
  // ===================================================================
  private async collectDescendants(startIds: string[]): Promise<string[]> {
    const result = new Set<string>(startIds);
    let queue = [...startIds];

    while (queue.length) {
      const children = await this.prisma.user.findMany({
        where: { parentId: { in: queue } },
        select: { id: true },
      });

      const ids = children.map((c) => c.id).filter((id) => !result.has(id));

      if (ids.length === 0) break;

      ids.forEach((id) => result.add(id));
      queue = ids;
    }

    return Array.from(result);
  }

  // ---------------- CREATE ----------------
  async create(
    dto: CreateUserKycDto,
    files?: Express.Multer.File[],
    currentUser?: AuthActor,
  ) {
    if (!currentUser?.id) throw new BadRequestException('Invalid user');

    const userId = currentUser.id;
    const role = await this.validateRole(currentUser);

    const exists = await this.prisma.userKyc.findFirst({ where: { userId } });
    if (exists) throw new ConflictException('User KYC already exists');

    const fileMap = this.mapFiles(files);

    try {
      // Create Address
      const address = await this.addressService.create(
        {
          address: dto.address,
          pinCode: dto.pinCode,
          cityId: dto.cityId,
          stateId: dto.stateId,
        },
        currentUser,
      );

      // Upload files
      const panFileUrl = await this.safeUpload(fileMap.panFile, 'user/pan');
      const aadhaarFileUrl = await this.safeUpload(
        fileMap.aadhaarFile,
        'user/aadhaar',
      );
      const addressProofUrl = await this.safeUpload(
        fileMap.addressProofFile,
        'user/address-proof',
      );
      const photoUrl = await this.safeUpload(fileMap.photo, 'user/photo');

      // Construct KYC data
      const kycData: CreateUserKycData = {
        userId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        fatherName: dto.fatherName,
        dob: new Date(dto.dob),
        gender: dto.gender,
        addressId: address.id,
        panFile: panFileUrl ?? '',
        aadhaarFile: aadhaarFileUrl ?? '',
        addressProofFile: addressProofUrl ?? '',
        photo: photoUrl ?? '',
      };

      const kyc = await this.prisma.userKyc.create({ data: kycData });

      // Store PII Consents

      const piiPayloads: PiiConsentCreateFields[] = [
        {
          userId,
          piiType: 'PAN',
          piiHash: this.cryptoService.encrypt(dto.pan),
          scope: 'USER_KYC',
          userKycId: kyc.id,
          providedAt: new Date(),
          expiresAt: new Date(Date.now() + 5 * 365 * 86400 * 1000),
        },
        {
          userId,
          piiType: 'AADHAAR',
          piiHash: this.cryptoService.encrypt(dto.aadhaar),
          scope: 'USER_KYC',
          userKycId: kyc.id,
          providedAt: new Date(),
          expiresAt: new Date(Date.now() + 5 * 365 * 86400 * 1000),
        },
      ];

      await this.piiService.create(piiPayloads, currentUser);

      // Audit Log
      await this.auditService.create({
        performerType: role.name,
        performerId: currentUser.id,
        targetUserType: 'USER',
        targetUserId: currentUser.id,
        action: 'CREATE_USER_KYC',
        resourceType: 'UserKyc',
        resourceId: kyc.id,
        newData: dto,
        description: 'User KYC created',
        status: AuditStatus.SUCCESS,
      });

      return kyc;
    } finally {
      FileDeleteHelper.deleteUploadedImages(files);
    }
  }

  // ---------------- GET BY USER ----------------
  async getByUserId(id: string) {
    const kyc = await this.prisma.userKyc.findFirst({
      where: { id },
      include: {
        address: { include: { city: true, state: true } },
        piiConsents: true,
      },
    });

    if (!kyc) throw new NotFoundException('User KYC not found');

    const pii = kyc.piiConsents.map((consent) => {
      const decrypted = this.cryptoService.decrypt(consent.piiHash);

      let masked = '';

      if (consent.piiType === 'PAN') {
        masked = decrypted.slice(0, 5) + '****' + decrypted.slice(-1);
      } else {
        masked = 'XXXXXXXX' + decrypted.slice(-4);
      }

      return {
        type: consent.piiType,
        value: decrypted,
        masked,
      };
    });

    return {
      id: kyc.id,
      userId: kyc.userId,
      firstName: kyc.firstName,
      lastName: kyc.lastName,
      fatherName: kyc.fatherName,
      dob: kyc.dob,
      gender: kyc.gender,
      status: kyc.status,
      type: kyc.type,
      kycRejectionReason: kyc.kycRejectionReason,

      address: kyc.address,
      pii,

      panFile: kyc.panFile,
      aadhaarFile: kyc.aadhaarFile,
      addressProofFile: kyc.addressProofFile,
      photo: kyc.photo,

      createdAt: kyc.createdAt,
      updatedAt: kyc.updatedAt,
      verifiedAt: kyc.verifiedAt,
      verifiedByUserId: kyc.verifiedByUserId,
      verifiedByType: kyc.verifiedByType,
    };
  }

  // ---------------- UPDATE ----------------
  async update(
    dto: UpdateUserKycDto,
    files?: Express.Multer.File[],
    currentUser?: AuthActor,
  ) {
    if (!currentUser?.id) throw new BadRequestException('Invalid user');

    const role = await this.validateRole(currentUser);

    const existing = await this.prisma.userKyc.findUnique({
      where: { id: dto.id },
    });

    if (!existing) throw new NotFoundException('User KYC not found');

    const fileMap = this.mapFiles(files);

    try {
      const updateData: UpdateUserKycData = {};

      // Upload + replace files
      if (fileMap.panFile && this.s3Service) {
        if (existing.panFile)
          await this.s3Service.delete({ fileUrl: existing.panFile });
        updateData.panFile = await this.s3Service.upload(
          fileMap.panFile.path,
          'user/pan',
        );
      }

      if (fileMap.aadhaarFile && this.s3Service) {
        if (existing.aadhaarFile)
          await this.s3Service.delete({ fileUrl: existing.aadhaarFile });
        updateData.aadhaarFile = await this.s3Service.upload(
          fileMap.aadhaarFile.path,
          'user/aadhaar',
        );
      }

      if (fileMap.addressProofFile && this.s3Service) {
        if (existing.addressProofFile)
          await this.s3Service.delete({ fileUrl: existing.addressProofFile });
        updateData.addressProofFile = await this.s3Service.upload(
          fileMap.addressProofFile.path,
          'user/address-proof',
        );
      }

      if (fileMap.photo && this.s3Service) {
        if (existing.photo)
          await this.s3Service.delete({ fileUrl: existing.photo });
        updateData.photo = await this.s3Service.upload(
          fileMap.photo.path,
          'user/photo',
        );
      }

      // Basic fields update
      Object.assign(updateData, {
        firstName: dto.firstName ?? existing.firstName,
        lastName: dto.lastName ?? existing.lastName,
        fatherName: dto.fatherName ?? existing.fatherName,
        dob: dto.dob ? new Date(dto.dob) : existing.dob,
        gender: dto.gender ?? existing.gender,
      });

      const updated = await this.prisma.userKyc.update({
        where: { id: dto.id },
        data: {
          firstName: { set: dto.firstName ?? existing.firstName },
          lastName: { set: dto.lastName ?? existing.lastName },
          fatherName: { set: dto.fatherName ?? existing.fatherName },
          dob: { set: dto.dob ? new Date(dto.dob) : existing.dob },
          gender: { set: dto.gender ?? existing.gender },

          panFile: updateData.panFile ? { set: updateData.panFile } : undefined,
          aadhaarFile: updateData.aadhaarFile
            ? { set: updateData.aadhaarFile }
            : undefined,
          addressProofFile: updateData.addressProofFile
            ? { set: updateData.addressProofFile }
            : undefined,
          photo: updateData.photo ? { set: updateData.photo } : undefined,
        },
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

      // Update Address
      if (dto.address || dto.cityId || dto.stateId || dto.pinCode) {
        await this.addressService.update(
          existing.addressId,
          {
            address: dto.address,
            cityId: dto.cityId,
            stateId: dto.stateId,
            pinCode: dto.pinCode,
          },
          currentUser,
        );
      }

      // Update PII
      if (dto.pan || dto.aadhaar) {
        await this.piiService.update(dto, currentUser);
      }

      // Audit Log
      await this.auditService.create({
        performerType: role.name,
        performerId: currentUser.id,
        targetUserType: updated.user.role.name,
        targetUserId: currentUser.id,
        action: 'UPDATE_USER_KYC',
        resourceType: 'UserKyc',
        description: `User KYC updated for ${dto.firstName} ${dto.lastName}`,
        resourceId: dto.id,
        newData: dto,
        status: AuditStatus.SUCCESS,
      });

      return updated;
    } finally {
      FileDeleteHelper.deleteUploadedImages(files);
    }
  }

  // ---------------- VERIFY ----------------
  async verify(kycId: string, dto: VerifyUserKycDto, currentUser: AuthActor) {
    const role = await this.validateRole(currentUser);

    const kyc = await this.prisma.userKyc.findUnique({ where: { id: kycId } });
    if (!kyc) throw new NotFoundException('User KYC not found');

    const updated = await this.prisma.userKyc.update({
      where: { id: kycId },
      data: {
        status: { set: dto.status },
        kycRejectionReason:
          dto.status === UserKycStatus.REJECTED
            ? (dto.rejectionReason ?? '')
            : '',
        verifiedAt: dto.status === UserKycStatus.VERIFIED ? new Date() : null,
        verifiedByUserId: currentUser.id,
        verifiedByType: role.name,
      },
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

    await this.auditService.create({
      performerType: role.name,
      performerId: currentUser.id,
      targetUserType: updated.user.role.name,
      targetUserId: kyc.userId,
      action: 'VERIFY_USER_KYC',
      resourceType: 'UserKyc',
      resourceId: kycId,
      description: `User KYC marked as ${dto.status}`,
      newData: dto,
      status: AuditStatus.SUCCESS,
    });

    return updated;
  }

  // ---------------- DELETE ----------------
  async delete(kycId: string, currentUser: AuthActor) {
    const role = await this.validateRole(currentUser);

    const kyc = await this.prisma.userKyc.findUnique({ where: { id: kycId } });
    if (!kyc) throw new NotFoundException('User KYC not found');

    const deleted = await this.prisma.userKyc.delete({
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

    // Delete PII
    await this.piiService.delete(kycId, currentUser);

    await this.auditService.create({
      performerType: role.name,
      performerId: currentUser.id,
      targetUserType: deleted.user.role.name,
      targetUserId: kyc.userId,
      action: 'DELETE_USER_KYC',
      resourceType: 'UserKyc',
      resourceId: kycId,
      description: 'User KYC deleted successfully',
      oldData: kyc,
      status: AuditStatus.SUCCESS,
    });

    return { message: 'User KYC deleted successfully' };
  }

  // ---------------- PRIVATE HELPERS ----------------
  private async validateRole(currentUser: AuthActor) {
    if (!currentUser.roleId) throw new BadRequestException('Invalid role');

    const role = await this.prisma.role.findUnique({
      where: { id: currentUser.roleId },
    });

    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  private mapFiles(files?: Express.Multer.File[]): FileMap {
    const map: FileMap = {
      panFile: null,
      aadhaarFile: null,
      addressProofFile: null,
      photo: null,
    };

    files?.forEach((file) => {
      if (file.fieldname in map) map[file.fieldname as keyof FileMap] = file;
    });

    return map;
  }

  private async safeUpload(file?: Express.Multer.File | null, prefix = '') {
    if (!file || !this.s3Service) return null;
    return this.s3Service.upload(file.path, prefix);
  }
}
