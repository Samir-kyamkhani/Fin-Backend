// JSON Field Interfaces
interface JSONMetadata {
  [key: string]: unknown;
}



interface RootCommissionEarningMetadata extends JSONMetadata {
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

interface RootLedgerMetadata extends JSONMetadata {
  auditInfo: AuditInfo;
  referenceDetails?: Record<string, unknown>;
  transactionDetails?: Record<string, unknown>;
}



interface IRootHierarchy {
  level: number;
  path: string;
  ancestors?: string[];
}










enum LedgerEntryType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}

enum LedgerReferenceType {
  TRANSACTION = 'TRANSACTION',
  COMMISSION = 'COMMISSION',
  REFUND = 'REFUND',
  ADJUSTMENT = 'ADJUSTMENT',
  BONUS = 'BONUS',
  CHARGE = 'CHARGE',
  FEE = 'FEE',
  TAX = 'TAX',
  PAYOUT = 'PAYOUT',
  COLLECTION = 'COLLECTION',
}


enum Currency {
  INR = 'INR',
  USD = 'USD',
  EUR = 'EUR',
}






enum RootStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

enum CreatorType {
  ROOT = 'ROOT',
  ADMIN = 'ADMIN',
  USER = 'USER',
}

enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}



enum CreatedByType {
  ROOT = 'ROOT',
  ADMIN = 'ADMIN',
}

enum ServiceStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

enum AssignedByType {
  ROOT = 'ROOT',
  ADMIN = 'ADMIN',
}

enum EntryType {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

enum ReferenceType {
  TRANSACTION = 'TRANSACTION',
  COMMISSION = 'COMMISSION',
  REFUND = 'REFUND',
  ADJUSTMENT = 'ADJUSTMENT',
  BONUS = 'BONUS',
  CHARGE = 'CHARGE',
  FEE = 'FEE',
  TAX = 'TAX',
  PAYOUT = 'PAYOUT',
  COLLECTION = 'COLLECTION',
}
