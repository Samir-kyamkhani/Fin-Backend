interface JSONMetadata {
  [key: string]: unknown;
}

export interface RootBankMetadata extends JSONMetadata {
  verifiedBy?: string;
  verifiedById?: string;
  verifiedAt?: Date;
  verificationReason?: string;
  rejectedBy?: string;
  rejectedById?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
}
