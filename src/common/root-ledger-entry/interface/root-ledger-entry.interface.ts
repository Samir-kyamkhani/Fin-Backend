// JSON Field Interfaces
interface JSONMetadata {
  [key: string]: unknown;
}

interface AuditInfo {
  performedAt: Date;
  performedBy?: string;
  performedById?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface RootLedgerMetadata extends JSONMetadata {
  auditInfo: AuditInfo;
  referenceDetails?: Record<string, unknown>;
  transactionDetails?: Record<string, unknown>;
}
