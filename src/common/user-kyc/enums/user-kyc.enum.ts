export enum UserGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum UserKycStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  HOLD = 'HOLD',
}

export enum UserKycType {
  AEPS = 'AEPS',
  USER_KYC = 'USER_KYC',
}

export enum VerifiedByType {
  ROOT = 'ROOT',
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
}

export enum RoleType {
  PROPRIETOR = 'PROPRIETOR',
  PARTNER = 'PARTNER',
  DIRECTOR = 'DIRECTOR',
}
