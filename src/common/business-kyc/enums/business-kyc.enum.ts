export enum BusinessType {
  PROPRIETORSHIP = 'proprietorship',
  PARTNERSHIP = 'partnership',
  PRIVATE_LIMITED = 'private_limited',
  PUBLIC_LIMITED = 'public_limited',
  LLP = 'llp',
  OPC = 'opc',
  NGO = 'ngo',
  TRUST = 'trust',
}

export enum KycStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
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
