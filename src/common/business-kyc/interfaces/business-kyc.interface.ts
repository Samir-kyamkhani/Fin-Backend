import { BusinessType, KycStatus } from '../enums/business-kyc.enum';

export interface BusinessKyc {
  id: string;
  userId: string;
  businessName: string;
  businessType: BusinessType;
  status: KycStatus;
  rejectionReason: string | null;
  addressId: string;
  panFile: string | null;
  gstFile: string | null;
  brDoc: string | null;
  partnershipDeed: string | null;
  moaFile: string | null;
  aoaFile: string | null;
  directorShareholding: string | null;
  partnerKycNumbers: number | null;
  cin: string | null;
  authorizedMemberCount: number;
  verifiedByRootId: string | null;
  verifiedByEmployeeId: string | null;
  verifiedByType: string | null;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessKycWithRelations extends BusinessKyc {
  address: {
    id: string;
    address: string;
    pinCode: string;
    cityId: string;
    stateId: string;

    city: {
      id: string;
      cityName: string;
      cityCode: string;
      createdAt: Date;
      updatedAt: Date;
      stateId: string | null;
    };

    state: {
      id: string;
      stateName: string;
      stateCode: string;
      createdAt: Date;
      updatedAt: Date;
    };
  };

  piiConsents: {
    id: string;
    userId: string;

    piiType: string;
    piiHash: string;
    scope: string;

    businessKycId: string | null;
    userKycId: string | null;

    providedAt: Date;
    expiresAt: Date;

    createdAt: Date;
  }[];
}

export interface CreateBusinessKycData {
  userId: string;
  businessName: string;
  businessType: BusinessType;
  addressId: string;

  panFile: string;
  gstFile: string;
  moaFile: string | null;
  aoaFile: string | null;
  cin: string | null;
  partnerKycNumbers: number | null;
  authorizedMemberCount: number;

  // REQUIRED by Prisma (these were missing)
  brDoc?: string | null;
  partnershipDeed?: string | null;
  directorShareholding?: string | null;
}

export interface UpdateBusinessKycData {
  businessName?: string;
  businessType?: BusinessType;
  panFile?: string;
  gstFile?: string;
  udhyamAadhar?: string | null;
  moaFile?: string | null;
  aoaFile?: string | null;
  cin?: string | null;
  partnerKycNumbers?: number | null;
  authorizedMemberCount?: number;

  // REQUIRED by Prisma (these were missing)
  brDoc?: string | null;
  partnershipDeed?: string | null;
  directorShareholding?: string | null;
}

export interface FileMap {
  panFile?: Express.Multer.File | null;
  gstFile?: Express.Multer.File | null;
  udhyamAadhar?: Express.Multer.File | null;
  moaFile?: Express.Multer.File | null;
  aoaFile?: Express.Multer.File | null;
}

export interface BusinessKycResponse {
  kyc: BusinessKycWithRelations;
  pii: {
    type: string;
    value: string;
    masked: string;
  }[];
}

export interface VerifyBusinessKycData {
  status: KycStatus;
  rejectionReason?: string;
  verifiedAt?: Date;
  verifiedByEmployeeId: string;
  verifiedByType: string;
}

export interface BusinessKycFilter {
  status?: KycStatus;
  search?: string;
}
