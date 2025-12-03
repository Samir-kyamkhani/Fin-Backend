export interface ILedgerMetadata {
  remarks?: string;
  serviceName?: string;
  provider?: string;
  originalAmount?: number;
  taxDetails?: {
    gst?: number;
    tds?: number;
    serviceTax?: number;
  };
  commissionDetails?: {
    rate?: number;
    amount?: number;
    level?: number;
  };
  paymentDetails?: {
    method?: string;
    gateway?: string;
    reference?: string;
  };
  userDetails?: {
    userId?: string;
    username?: string;
    email?: string;
  };
  auditInfo?: {
    performedByType?: string;
    performedById?: string;
    action?: string;
    performedAt: Date;
  };
}
