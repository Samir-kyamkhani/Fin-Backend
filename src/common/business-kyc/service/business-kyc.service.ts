import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Sequelize } from 'sequelize';
import { User } from 'src/user/entities/user.entity';
import { Address } from 'src/common/address/entities/address.entity';
import { PiiConsent } from 'src/common/pii-consent/entities/pii-consent.entity';
import { City } from 'src/common/city/entities/city.entity';
import { State } from 'src/common/state/entities/state.entity';
import { BusinessKyc } from '../entities/business-kyc.entity';
import { S3Service } from 'src/utils/s3/s3.service';
import { CreateBusinessKycDto } from '../dto/create-business-kyc.dto';

interface CurrentUser {
  id: string;
  role: string;
  // Add other user properties as needed
}

interface BusinessKycResponse {
  id: string;
  profile: {
    businessName: string;
    businessType: string;
    userId: string;
    userName: string;
    email: string;
    phone: string;
    username: string;
    role: string;
    roleId: string | null;
    hierarchyLevel: number | null;
    hierarchyPath: string;
    createdById: string | null;
    createdByType: string;
  };
  creator: any | null;
  documents: any[];
  additionalInfo: {
    panNumber: string | null;
    gstNumber: string | null;
    udhyamAadhar: string | null;
    cin: string | null;
    partnerKycNumbers: number | null;
    authorizedMemberCount: number | null;
  };
  location: {
    id: string | null;
    city: string;
    state: string;
    address: string;
    pinCode: string;
  };
  status: string;
  files: {
    panFile: string | null;
    gstFile: string | null;
    udhyamAadhar: string | null;
    brDoc: string | null;
    partnershipDeed: string | null;
    moaFile: string | null;
    aoaFile: string | null;
    directorShareholding: string | null;
  };
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class BusinessKycService {
  constructor(
    @InjectModel(BusinessKyc)
    private readonly businessKycModel: typeof BusinessKyc,
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(Address)
    private readonly addressModel: typeof Address,
    @InjectModel(PiiConsent)
    private readonly piiConsentModel: typeof PiiConsent,
    private readonly s3Service: S3Service,
    private readonly sequelize: Sequelize,
  ) {}

  async getById(
    businessKycId: string,
    currentUser: CurrentUser,
  ): Promise<BusinessKycResponse> {
    const transaction = await this.sequelize.transaction();

    try {
      const businessKyc = await this.businessKycModel.findByPk(businessKycId, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: [
              'id',
              'email',
              'phoneNumber',
              'username',
              'firstName',
              'lastName',
              'parentId',
              'roleId',
              'hierarchyLevel',
              'hierarchyPath',
              'createdById',
              'createdByType',
            ],
            include: [
              {
                model: User,
                as: 'parent',
                attributes: [
                  'id',
                  'firstName',
                  'lastName',
                  'username',
                  'hierarchyLevel',
                  'hierarchyPath',
                  'email',
                  'phoneNumber',
                  'roleId',
                ],
                required: false,
              },
              {
                model: User,
                as: 'creatorUser',
                attributes: [
                  'id',
                  'firstName',
                  'lastName',
                  'username',
                  'hierarchyLevel',
                  'hierarchyPath',
                  'email',
                  'phoneNumber',
                  'roleId',
                ],
                required: false,
              },
              {
                model: Root,
                as: 'creatorRoot',
                attributes: [
                  'id',
                  'firstName',
                  'lastName',
                  'username',
                  'email',
                  'phoneNumber',
                ],
                required: false,
              },
              {
                model: Role,
                as: 'role',
                attributes: ['id', 'name'],
                required: false,
              },
            ],
          },
          {
            model: Address,
            as: 'address',
            include: [
              { model: City, as: 'city', attributes: ['cityName'] },
              { model: State, as: 'state', attributes: ['stateName'] },
            ],
          },
          {
            model: PiiConsent,
            as: 'piiConsents',
            attributes: [
              'id',
              'piiType',
              'piiHash',
              'scope',
              'businessKycId',
              'userKycId',
              'providedAt',
              'expiresAt',
            ],
          },
        ],
        transaction,
      });

      if (!businessKyc) {
        throw new NotFoundException('Business KYC application not found');
      }

      // Decrypt PII data
      const piiData = await Promise.all(
        (businessKyc.piiConsents || []).map(async (pii) => {
          try {
            // Assuming CryptoService.decrypt exists
            // const decryptedValue = CryptoService.decrypt(pii.piiHash);
            return {
              id: pii.id,
              piiType: pii.piiType,
              piiValue: `[Decrypted: ${pii.piiHash}]`, // Replace with actual decryption
              scope: pii.scope,
              businessKycId: pii.businessKycId,
              userKycId: pii.userKycId,
              providedAt: pii.providedAt,
              expiresAt: pii.expiresAt,
            };
          } catch (error) {
            return {
              id: pii.id,
              piiType: pii.piiType,
              piiValue: `[Encrypted Data - ${pii.piiHash?.slice(0, 8)}...]`,
              scope: pii.scope,
              businessKycId: pii.businessKycId,
              userKycId: pii.userKycId,
              providedAt: pii.providedAt,
              expiresAt: pii.expiresAt,
            };
          }
        }),
      );

      const getUserRole = (user: any): string => {
        return user?.role?.name || 'N/A';
      };

      const userProfile = {
        businessName: businessKyc.businessName,
        businessType: businessKyc.businessType,
        userId: businessKyc.userId,
        userName:
          businessKyc.user?.firstName || businessKyc.user?.lastName
            ? `${businessKyc.user?.firstName || ''} ${businessKyc.user?.lastName || ''}`.trim()
            : 'N/A',
        email: businessKyc.user?.email || 'N/A',
        phone: businessKyc.user?.phoneNumber || 'N/A',
        username: businessKyc.user?.username || 'N/A',
        role: getUserRole(businessKyc.user),
        roleId: businessKyc.user?.roleId || null,
        hierarchyLevel: businessKyc.user?.hierarchyLevel || null,
        hierarchyPath: businessKyc.user?.hierarchyPath || 'N/A',
        createdById: businessKyc.user?.createdById || null,
        createdByType: businessKyc.user?.createdByType || 'N/A',
      };

      let creatorData = null;
      if (
        businessKyc.user?.createdByType === 'ROOT' &&
        businessKyc.user?.creatorRoot
      ) {
        creatorData = {
          id: businessKyc.user.creatorRoot.id,
          username: businessKyc.user.creatorRoot.username || 'N/A',
          name:
            businessKyc.user.creatorRoot.firstName ||
            businessKyc.user.creatorRoot.lastName
              ? `${businessKyc.user.creatorRoot.firstName || ''} ${businessKyc.user.creatorRoot.lastName || ''}`.trim()
              : 'N/A',
          email: businessKyc.user.creatorRoot.email || 'N/A',
          phone: businessKyc.user.creatorRoot.phoneNumber || 'N/A',
          type: 'ROOT',
        };
      }

      await transaction.commit();

      return {
        id: businessKyc.id,
        profile: userProfile,
        creator: creatorData,
        documents: piiData,
        additionalInfo: {
          panNumber: businessKyc.panNumber
            ? `${businessKyc.panNumber.slice(0, 4)}XXXX${businessKyc.panNumber.slice(-4)}`
            : null,
          gstNumber: businessKyc.gstNumber
            ? `${businessKyc.gstNumber.slice(0, 4)}XXXX${businessKyc.gstNumber.slice(-4)}`
            : null,
          udhyamAadhar: businessKyc.udhyamAadhar || null,
          cin: businessKyc.cin || null,
          partnerKycNumbers: businessKyc.partnerKycNumbers || null,
          authorizedMemberCount: businessKyc.authorizedMemberCount || null,
        },
        location: {
          id: businessKyc.address?.id || null,
          city: businessKyc.address?.city?.cityName || 'N/A',
          state: businessKyc.address?.state?.stateName || 'N/A',
          address: businessKyc.address?.address || 'N/A',
          pinCode: businessKyc.address?.pinCode || 'N/A',
        },
        status: businessKyc.status,
        files: {
          panFile: businessKyc.panFile || null,
          gstFile: businessKyc.gstFile || null,
          udhyamAadhar: businessKyc.udhyamAadhar || null,
          brDoc: businessKyc.brDoc || null,
          partnershipDeed: businessKyc.partnershipDeed || null,
          moaFile: businessKyc.moaFile || null,
          aoaFile: businessKyc.aoaFile || null,
          directorShareholding: businessKyc.directorShareholding || null,
        },
        rejectionReason: businessKyc.rejectionReason || null,
        createdAt: businessKyc.createdAt,
        updatedAt: businessKyc.updatedAt,
      };
    } catch (error) {
      await transaction.rollback();
      throw new InternalServerErrorException(
        `Failed to get Business KYC: ${error.message}`,
      );
    }
  }

  async create(
    currentUser: CurrentUser,
    createDto: CreateBusinessKycDto,
    files: any,
  ): Promise<BusinessKyc> {
    const transaction = await this.sequelize.transaction();

    try {
      const { ...businessKycData } = createDto;
      const userId = currentUser.id;

      // Check for existing Business KYC
      const existingBusinessKyc = await this.businessKycModel.findOne({
        where: {
          userId: userId,
          panNumber: businessKycData.panNumber,
          gstNumber: businessKycData.gstNumber,
        },
        transaction,
      });

      if (existingBusinessKyc) {
        throw new ConflictException(
          'Business KYC already exists for this user',
        );
      }

      // Create address
      const address = await this.addressModel.create(
        {
          address: businessKycData.address,
          pinCode: businessKycData.pinCode,
          stateId: businessKycData.stateId,
          cityId: businessKycData.cityId,
        },
        { transaction },
      );

      // Upload files
      const panUrl = await this.s3Service.upload(
        files.panFile[0].path,
        'business-kyc',
      );
      const gstUrl = await this.s3Service.upload(
        files.gstFile[0].path,
        'business-kyc',
      );

      if (!panUrl || !gstUrl) {
        throw new InternalServerErrorException(
          'Failed to upload required KYC documents',
        );
      }

      // Upload optional files
      const uploadOptionalFile = async (fileArray: any[], fileType: string) => {
        if (fileArray && fileArray[0]) {
          const url = await this.s3Service.upload(
            fileArray[0].path,
            'business-kyc',
          );
          return url;
        }
        return null;
      };

      const optionalFiles = {
        udhyamAadhar: await uploadOptionalFile(
          files.udhyamAadhar,
          'udhyamAadhar',
        ),
        brDoc: await uploadOptionalFile(files.brDoc, 'brDoc'),
        partnershipDeed: await uploadOptionalFile(
          files.partnershipDeed,
          'partnershipDeed',
        ),
        moaFile: await uploadOptionalFile(files.moaFile, 'moaFile'),
        aoaFile: await uploadOptionalFile(files.aoaFile, 'aoaFile'),
        directorShareholding: await uploadOptionalFile(
          files.directorShareholding,
          'directorShareholding',
        ),
      };

      // Create Business KYC
      const businessKyc = await this.businessKycModel.create(
        {
          userId: userId,
          businessName: businessKycData.businessName.trim(),
          businessType: businessKycData.businessType,
          addressId: address.id,
          panNumber: businessKycData.panNumber,
          gstNumber: businessKycData.gstNumber,
          panFile: panUrl,
          gstFile: gstUrl,
          udhyamAadhar: optionalFiles.udhyamAadhar,
          brDoc: optionalFiles.brDoc,
          partnershipDeed: optionalFiles.partnershipDeed,
          partnerKycNumbers: businessKycData.partnerKycNumbers,
          cin: businessKycData.cin,
          moaFile: optionalFiles.moaFile,
          aoaFile: optionalFiles.aoaFile,
          authorizedMemberCount: businessKycData.authorizedMemberCount,
          directorShareholding: optionalFiles.directorShareholding,
          status: 'PENDING',
        },
        { transaction },
      );

      // Create PII consents
      await this.piiConsentModel.bulkCreate(
        [
          {
            userId: userId,
            businessKycId: businessKyc.id,
            piiType: 'PAN',
            piiHash: businessKycData.panNumber.toUpperCase(), // Should be encrypted
            scope: 'BUSINESS_KYC_VERIFICATION',
            expiresAt: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
          },
          {
            userId: userId,
            businessKycId: businessKyc.id,
            piiType: 'GST',
            piiHash: businessKycData.gstNumber.toUpperCase(), // Should be encrypted
            scope: 'BUSINESS_KYC_VERIFICATION',
            expiresAt: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
          },
        ],
        { transaction },
      );

      await transaction.commit();
      return businessKyc;
    } catch (error) {
      await transaction.rollback();
      throw new InternalServerErrorException(
        `Failed to create Business KYC: ${error.message}`,
      );
    }
  }

  async update(
    businessKycId: string,
    currentUser: CurrentUser,
    updateDto: UpdateBusinessKycDto,
    files: any,
  ): Promise<BusinessKyc> {
    const transaction = await this.sequelize.transaction();

    try {
      const existingBusinessKyc = await this.businessKycModel.findByPk(
        businessKycId,
        {
          include: [{ model: Address, as: 'address' }],
          transaction,
        },
      );

      if (!existingBusinessKyc) {
        throw new NotFoundException('Business KYC not found');
      }

      // Check for duplicates
      if (updateDto.panNumber || updateDto.gstNumber) {
        const whereCondition: any = {
          userId: existingBusinessKyc.userId,
          id: { [Op.ne]: businessKycId },
        };

        if (updateDto.panNumber) whereCondition.panNumber = updateDto.panNumber;
        if (updateDto.gstNumber) whereCondition.gstNumber = updateDto.gstNumber;

        const duplicateBusinessKyc = await this.businessKycModel.findOne({
          where: whereCondition,
          transaction,
        });

        if (duplicateBusinessKyc) {
          throw new ConflictException(
            'Business KYC with same PAN or GST already exists for this user',
          );
        }
      }

      // Update address if needed
      let addressId = existingBusinessKyc.addressId;
      if (
        updateDto.address ||
        updateDto.pinCode ||
        updateDto.stateId ||
        updateDto.cityId
      ) {
        const addressPayload: any = {};
        if (updateDto.address) addressPayload.address = updateDto.address;
        if (updateDto.pinCode) addressPayload.pinCode = updateDto.pinCode;
        if (updateDto.stateId) addressPayload.stateId = updateDto.stateId;
        if (updateDto.cityId) addressPayload.cityId = updateDto.cityId;

        const address = existingBusinessKyc.address?.id
          ? await existingBusinessKyc.address.update(addressPayload, {
              transaction,
            })
          : await this.addressModel.create(addressPayload, { transaction });

        addressId = address.id;
      }

      // Handle file uploads
      const filesToDelete: Array<{ fileUrl: string; fileType: string }> = [];

      const uploadFile = async (
        fileArray: any[],
        existingUrl: string,
        fileType: string,
      ): Promise<string> => {
        if (fileArray && fileArray[0]) {
          if (existingUrl) {
            filesToDelete.push({ fileUrl: existingUrl, fileType });
          }
          const url = await this.s3Service.upload(
            fileArray[0].path,
            'business-kyc',
          );
          return url || existingUrl;
        }
        return existingUrl;
      };

      const panUrl = await uploadFile(
        files?.panFile,
        existingBusinessKyc.panFile,
        'panFile',
      );
      const gstUrl = await uploadFile(
        files?.gstFile,
        existingBusinessKyc.gstFile,
        'gstFile',
      );

      const optionalFiles = {
        udhyamAadhar: await uploadFile(
          files?.udhyamAadhar,
          existingBusinessKyc.udhyamAadhar,
          'udhyamAadhar',
        ),
        brDoc: await uploadFile(
          files?.brDoc,
          existingBusinessKyc.brDoc,
          'brDoc',
        ),
        partnershipDeed: await uploadFile(
          files?.partnershipDeed,
          existingBusinessKyc.partnershipDeed,
          'partnershipDeed',
        ),
        moaFile: await uploadFile(
          files?.moaFile,
          existingBusinessKyc.moaFile,
          'moaFile',
        ),
        aoaFile: await uploadFile(
          files?.aoaFile,
          existingBusinessKyc.aoaFile,
          'aoaFile',
        ),
        directorShareholding: await uploadFile(
          files?.directorShareholding,
          existingBusinessKyc.directorShareholding,
          'directorShareholding',
        ),
      };

      // Prepare update data
      const updateData: any = {
        businessName:
          updateDto.businessName?.trim() || existingBusinessKyc.businessName,
        businessType:
          updateDto.businessType || existingBusinessKyc.businessType,
        addressId: addressId,
        panNumber: updateDto.panNumber || existingBusinessKyc.panNumber,
        gstNumber: updateDto.gstNumber || existingBusinessKyc.gstNumber,
        panFile: panUrl,
        gstFile: gstUrl,
        udhyamAadhar: optionalFiles.udhyamAadhar,
        brDoc: optionalFiles.brDoc,
        partnershipDeed: optionalFiles.partnershipDeed,
        partnerKycNumbers:
          updateDto.partnerKycNumbers ?? existingBusinessKyc.partnerKycNumbers,
        cin: updateDto.cin ?? existingBusinessKyc.cin,
        moaFile: optionalFiles.moaFile,
        aoaFile: optionalFiles.aoaFile,
        authorizedMemberCount:
          updateDto.authorizedMemberCount ??
          existingBusinessKyc.authorizedMemberCount,
        directorShareholding: optionalFiles.directorShareholding,
      };

      // Remove undefined values
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      // Update BusinessKyc
      const updatedBusinessKyc = await existingBusinessKyc.update(updateData, {
        transaction,
      });

      // Update PII consents if PAN or GST changed
      if (updateDto.panNumber || updateDto.gstNumber) {
        const existingPiiConsents = await this.piiConsentModel.findAll({
          where: {
            businessKycId: businessKycId,
            piiType: { [Op.in]: ['PAN', 'GST'] },
          },
          transaction,
        });

        const piiConsentUpdates = [];

        if (updateDto.panNumber) {
          const panConsent = existingPiiConsents.find(
            (consent) => consent.piiType === 'PAN',
          );
          if (panConsent) {
            await panConsent.update(
              {
                piiHash: updateDto.panNumber.toUpperCase(), // Should be encrypted
              },
              { transaction },
            );
          }
        }

        if (updateDto.gstNumber) {
          const gstConsent = existingPiiConsents.find(
            (consent) => consent.piiType === 'GST',
          );
          if (gstConsent) {
            await gstConsent.update(
              {
                piiHash: updateDto.gstNumber.toUpperCase(), // Should be encrypted
              },
              { transaction },
            );
          }
        }
      }

      // Delete old files from S3
      for (const fileInfo of filesToDelete) {
        try {
          await this.s3Service.delete({ fileUrl: fileInfo.fileUrl });
        } catch (deleteError) {
          console.error(
            `Failed to delete old ${fileInfo.fileType} from S3:`,
            deleteError.message,
          );
        }
      }

      await transaction.commit();
      return updatedBusinessKyc;
    } catch (error) {
      await transaction.rollback();
      throw new InternalServerErrorException(
        `Failed to update Business KYC: ${error.message}`,
      );
    }
  }

  async verify(
    currentUser: CurrentUser,
    verifyDto: VerifyBusinessKycDto,
  ): Promise<BusinessKyc> {
    const transaction = await this.sequelize.transaction();

    try {
      const { id, status, rejectionReason = null } = verifyDto;

      const allowedStatuses = ['VERIFIED', 'REJECTED', 'HOLD', 'PROCESSING'];
      if (!allowedStatuses.includes(status)) {
        throw new BadRequestException(
          `Invalid status. Allowed statuses: ${allowedStatuses.join(', ')}`,
        );
      }

      const businessKyc = await this.businessKycModel.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'firstName', 'lastName'],
          },
        ],
        transaction,
      });

      if (!businessKyc) {
        throw new NotFoundException('Business KYC application not found');
      }

      const oldStatus = businessKyc.status;

      // Prevent duplicate final status
      if (['VERIFIED', 'REJECTED'].includes(oldStatus)) {
        if (oldStatus === status) {
          throw new BadRequestException(
            `Cannot update KYC. Current status is already '${oldStatus}'`,
          );
        }

        // Prevent downgrading VERIFIED/REJECTED to HOLD/PROCESSING
        if (['HOLD', 'PROCESSING'].includes(status)) {
          throw new BadRequestException(
            `Cannot change KYC from '${oldStatus}' to '${status}'`,
          );
        }
      }

      // Update KYC
      const verifiedById = ['VERIFIED', 'REJECTED'].includes(status)
        ? currentUser.id
        : null;
      const verifiedAt = ['VERIFIED', 'REJECTED'].includes(status)
        ? new Date()
        : null;

      await businessKyc.update(
        {
          status,
          rejectionReason: status === 'REJECTED' ? rejectionReason : null,
          verifiedById,
          verifiedByType: ['VERIFIED', 'REJECTED'].includes(status)
            ? 'Root'
            : null,
          verifiedAt,
        },
        { transaction },
      );

      await transaction.commit();

      return await this.businessKycModel.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'firstName', 'lastName'],
          },
          { model: Address, as: 'address' },
          { model: PiiConsent, as: 'piiConsents' },
        ],
      });
    } catch (error) {
      await transaction.rollback();
      throw new InternalServerErrorException(
        `Failed to verify Business KYC: ${error.message}`,
      );
    }
  }

  async getAll(
    currentUser: CurrentUser,
    query: BusinessKycQueryDto,
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    try {
      const {
        status = 'ALL',
        page = 1,
        limit = 10,
        sort = 'desc',
        search,
      } = query;
      const offset = (page - 1) * limit;

      let whereCondition: any = {};

      if (status !== 'ALL') whereCondition.status = status;

      if (search) {
        whereCondition = {
          ...whereCondition,
          [Op.or]: [
            { businessName: { [Op.iLike]: `%${search}%` } },
            { '$user.email$': { [Op.iLike]: `%${search}%` } },
            { '$user.phoneNumber$': { [Op.iLike]: `%${search}%` } },
          ],
        };
      }

      const { count, rows: businessKycs } =
        await this.businessKycModel.findAndCountAll({
          where: whereCondition,
          include: [
            {
              model: User,
              as: 'user',
              attributes: [
                'id',
                'email',
                'phoneNumber',
                'username',
                'firstName',
                'lastName',
                'roleId',
                'hierarchyLevel',
                'hierarchyPath',
                'createdById',
                'createdByType',
              ],
              include: [
                {
                  model: User,
                  as: 'parent',
                  attributes: ['firstName', 'lastName', 'username'],
                },
                {
                  model: User,
                  as: 'creatorUser',
                  attributes: [
                    'id',
                    'firstName',
                    'lastName',
                    'username',
                    'hierarchyLevel',
                    'hierarchyPath',
                    'email',
                    'phoneNumber',
                    'roleId',
                  ],
                  required: false,
                },
                {
                  model: Root,
                  as: 'creatorRoot',
                  attributes: [
                    'id',
                    'firstName',
                    'lastName',
                    'username',
                    'email',
                    'phoneNumber',
                  ],
                  required: false,
                },
                {
                  model: Role,
                  as: 'role',
                  attributes: ['id', 'name'],
                  required: false,
                },
              ],
            },
            {
              model: Address,
              as: 'address',
              include: [
                { model: City, as: 'city', attributes: ['cityName'] },
                { model: State, as: 'state', attributes: ['stateName'] },
              ],
            },
          ],
          order: [['createdAt', sort.toUpperCase()]],
          limit,
          offset,
          distinct: true,
        });

      const formattedBusinessKycs = businessKycs.map((businessKyc) => {
        const getUserRole = (user: any): string => user?.role?.name || 'N/A';

        let creatorData = null;
        if (
          businessKyc.user?.createdByType === 'ROOT' &&
          businessKyc.user?.creatorRoot
        ) {
          creatorData = {
            id: businessKyc.user.creatorRoot.id,
            username: businessKyc.user.creatorRoot.username || 'N/A',
            name:
              businessKyc.user.creatorRoot.firstName ||
              businessKyc.user.creatorRoot.lastName
                ? `${businessKyc.user.creatorRoot.firstName || ''} ${businessKyc.user.creatorRoot.lastName || ''}`.trim()
                : 'N/A',
            email: businessKyc.user.creatorRoot.email || 'N/A',
            phone: businessKyc.user.creatorRoot.phoneNumber || 'N/A',
            type: 'ROOT',
          };
        }

        return {
          id: businessKyc.id,
          profile: {
            businessName: businessKyc.businessName,
            businessType: businessKyc.businessType,
            userId: businessKyc.userId,
            userName: `${businessKyc.user?.firstName || '-'} ${businessKyc.user?.lastName || '-'}`,
            email: businessKyc.user?.email || '-',
            phone: businessKyc.user?.phoneNumber || '-',
            username: businessKyc.user?.username || '-',
            role: getUserRole(businessKyc.user),
            roleId: businessKyc.user?.roleId || null,
            hierarchyLevel: businessKyc.user?.hierarchyLevel || null,
            hierarchyPath: businessKyc.user?.hierarchyPath || 'N/A',
            createdById: businessKyc.user?.createdById || null,
            createdByType: businessKyc.user?.createdByType || 'N/A',
          },
          creator: creatorData,
          location: {
            city: businessKyc.address?.city?.cityName || '-',
            state: businessKyc.address?.state?.stateName || '-',
            address: businessKyc.address?.address || '-',
            pinCode: businessKyc.address?.pinCode || '-',
          },
          additionalInfo: {
            panNumber: businessKyc.panNumber
              ? `[Masked - ${businessKyc.panNumber.slice(0, 4)}XXXX${businessKyc.panNumber.slice(-4)}]`
              : null,
            gstNumber: businessKyc.gstNumber
              ? `[Masked - ${businessKyc.gstNumber.slice(0, 4)}XXXX${businessKyc.gstNumber.slice(-4)}]`
              : null,
            udhyamAadhar: businessKyc.udhyamAadhar || null,
            cin: businessKyc.cin || null,
            partnerKycNumbers: businessKyc.partnerKycNumbers || null,
            authorizedMemberCount: businessKyc.authorizedMemberCount || null,
          },
          files: {
            panFile: businessKyc.panFile || null,
            gstFile: businessKyc.gstFile || null,
            udhyamAadhar: businessKyc.udhyamAadhar || null,
            brDoc: businessKyc.brDoc || null,
            partnershipDeed: businessKyc.partnershipDeed || null,
            moaFile: businessKyc.moaFile || null,
            aoaFile: businessKyc.aoaFile || null,
            directorShareholding: businessKyc.directorShareholding || null,
          },
          status: businessKyc.status,
          rejectionReason: businessKyc.rejectionReason || null,
          createdAt: businessKyc.createdAt,
          updatedAt: businessKyc.updatedAt,
        };
      });

      return {
        data: formattedBusinessKycs,
        total: count,
        page: parseInt(page.toString()),
        limit: parseInt(limit.toString()),
        pages: Math.ceil(count / limit),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to get Business KYC applications: ${error.message}`,
      );
    }
  }
}
