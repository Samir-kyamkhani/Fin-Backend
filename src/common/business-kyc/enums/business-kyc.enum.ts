export enum BusinessType {
  PROPRIETORSHIP = 'PROPRIETORSHIP',
  PARTNERSHIP = 'PARTNERSHIP',
  PRIVATE_LIMITED = 'PRIVATE_LIMITED',
  PUBLIC_LIMITED = 'PUBLIC_LIMITED',
  LLP = 'LLP',
  TRUST = 'TRUST',
  SOCIETY = 'SOCIETY',
}

export enum KycStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

export enum VerifiedByType {
  SYSTEM = 'system',
  EMPLOYEE = 'employee',
  ROOT = 'root',
  ADMIN = 'admin',
}

export enum DocumentType {
  PAN = 'pan',
  GST = 'gst',
  UDYAM_AADHAR = 'udyam_aadhar',
  BR_DOC = 'br_doc',
  PARTNERSHIP_DEED = 'partnership_deed',
  MOA = 'moa',
  AOA = 'aoa',
  DIRECTOR_SHAREHOLDING = 'director_shareholding',
  OTHER = 'other',
}
