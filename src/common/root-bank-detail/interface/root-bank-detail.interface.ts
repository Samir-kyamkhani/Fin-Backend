export interface IRootBankMetadata {
  remarks?: string;
  verifiedBy?: string;
  rejectedBy?: string;
  verifiedById?: string;
  rejectedById?: string;
  verifiedAt?: Date;
  rejectedAt?: Date;
  verificationReason?: string;
  rejectionReason?: string;
  documentType?: string;
  documentNumber?: string;
  branchName?: string;
  branchAddress?: string;
}
