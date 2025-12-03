export interface JSONMetadata {
  [key: string]: unknown;
}

export interface CommissionMetadata extends JSONMetadata {
  calculatedAt: Date;
  commissionRate?: number;
  transactionDetails?: Record<string, unknown>;
  breakdown?: {
    baseAmount: number;
    commission: number;
    deductions: {
      tds: number;
      gst: number;
    };
  };
}
