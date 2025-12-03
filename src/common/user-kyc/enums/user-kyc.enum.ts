export enum UserGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum UserKycStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum UserKycType {
  USER_KYC = 'USER_KYC',
  BUSINESS_KYC = 'BUSINESS_KYC',
}

export enum VerifiedByType {
  ROOT = 'ROOT',
  USER = 'USER',
  EMPLOYEE = 'EMPLOYEE',
}

export enum RoleType {
  PROPRIETOR = 'PROPRIETOR',
  PARTNER = 'PARTNER',
  DIRECTOR = 'DIRECTOR',
  AUTHORIZED_SIGNATORY = 'AUTHORIZED_SIGNATORY',
}
