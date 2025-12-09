export interface PiiConsentUpdateFields {
  piiType?: string;
  scope?: string;
  piiHash?: string;
  businessKycId?: string | null;
  userKycId?: string | null;
}

export interface PiiConsentCreateFields {
  userId: string;
  piiType: string;
  scope: string;
  piiHash: string;
  businessKycId?: string;
  userKycId?: string;
  providedAt: Date;
  expiresAt: Date;
}

export interface PiiConsentType {
  id: string;
  userId: string;
  userKycId: string | null;
  businessKycId: string | null;
  piiType: string;
  piiHash: string;
  providedAt: Date;
  expiresAt: Date;
  scope: string;
  createdAt: Date;

  // relations (optional)
  user?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    // add any other user fields you need
  } | null;

  userKyc?: Record<string, any> | null; // optional
  businessKyc?: Record<string, any> | null; // optional
}
