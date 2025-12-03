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

export interface LedgerMetadata extends JSONMetadata {
  auditInfo: AuditInfo;
  transactionDetails?: Record<string, unknown>;
  referenceDetails?: Record<string, unknown>;
}
