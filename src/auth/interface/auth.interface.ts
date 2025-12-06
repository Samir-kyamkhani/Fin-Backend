// ==================== AUTH =====================

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export type PrincipalType = 'ROOT' | 'USER' | 'EMPLOYEE';

export interface JwtPayload {
  sub: string; // principal id (root.id / user.id / employee.id)
  principalType: PrincipalType;
  roleId?: string | null; // for ROOT + USER
  departmentId?: string | null; // for EMPLOYEE
  isRoot?: boolean; // fast bypass flag
}

export interface AuthActor {
  id: string;
  principalType: PrincipalType;
  isRoot: boolean;
  roleId?: string | null;
  departmentId?: string | null;
}

// ==================== EMAIL =====================

export interface BaseUserOptions {
  firstName: string;
  username?: string;
  email?: string;
  password?: string;
  customMessage?: string | null;
}

export interface EmployeeCredentialsOptions extends BaseUserOptions {
  role: string;
  permissions?: string[];
  actionType?: 'created' | 'reset';
}

export interface BusinessUserCredentialsOptions extends BaseUserOptions {
  transactionPin: string;
  actionType?: 'created' | 'reset';
}

export interface RootUserCredentialsOptions extends BaseUserOptions {
  actionType?: 'created' | 'reset';
}

export interface PasswordResetOptions {
  firstName: string;
  resetUrl: string;
  expiryMinutes?: number;
  supportEmail?: string | null;
  customMessage?: string | null;
}

export interface EmailVerificationOptions {
  firstName: string;
  verifyUrl: string;
}

export interface EmailTemplateResult {
  subject: string;
  html: string;
  text: string;
}
