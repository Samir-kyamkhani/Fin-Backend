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
