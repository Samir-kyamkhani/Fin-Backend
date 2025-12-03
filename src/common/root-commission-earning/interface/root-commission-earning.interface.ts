interface JSONMetadata {
  [key: string]: unknown;
}

export interface RootCommissionEarningMetadata extends JSONMetadata {
  calculatedAt: Date;
  commissionRate?: number;
  breakdown?: {
    baseAmount: number;
    commission: number;
    deductions: {
      tds: number;
      gst: number;
    };
  };
}
