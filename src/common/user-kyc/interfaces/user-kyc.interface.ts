import {
  UserKycStatus,
  UserGender,
  UserKycType,
  RoleType,
} from '../enums/user-kyc.enum';

export interface UserKycWithRelations {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  fatherName: string;
  dob: Date;
  gender: UserGender;
  status: UserKycStatus;
  type: UserKycType;
  kycRejectionReason?: string | null;
  addressId: string;
  panFile: string;
  aadhaarFile: string;
  addressProofFile: string;
  photo: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  verifiedByType?: string | null;
  verifiedByRootId?: string | null;
  verifiedByUserId?: string | null;
  verifiedAt?: Date | null;
  businessKycId?: string | null;
  roleType: RoleType;

  // Relations
  address: any;
  piiConsents: any[];
  verifiedByUser?: string | null;
}

export interface CreateUserKycData {
  userId: string;
  firstName: string;
  lastName: string;
  fatherName: string;
  dob: Date;
  gender: UserGender;
  addressId: string;
  panFile: string;
  aadhaarFile: string;
  addressProofFile: string;
  photo: string;
}

export interface UpdateUserKycData {
  firstName?: string | null;
  lastName?: string | null;
  fatherName?: string | null;
  dob?: Date | null;
  gender?: UserGender | null;
  panFile?: string | null;
  aadhaarFile?: string | null;
  addressProofFile?: string | null;
  photo?: string | null;
}

export interface VerifyUserKycData {
  status: UserKycStatus;
  rejectionReason: string;
  verifiedAt: Date | null;
  verifiedByUserId: string | null;
  verifiedByType: string | null;
}

export interface FileMap {
  panFile: Express.Multer.File | null;
  aadhaarFile: Express.Multer.File | null;
  addressProofFile: Express.Multer.File | null;
  photo: Express.Multer.File | null;
}

export interface PaginatedKycResponse {
  data: any[];
  page: number;
  limit: number;
  total: number;

  stats: {
    total: number;
    pending: number;
    verified: number;
    rejected: number;
  };
}
