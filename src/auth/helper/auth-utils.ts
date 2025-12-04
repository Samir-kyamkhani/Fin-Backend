import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthActor, PrincipalType } from '../types/principal.type.js';
import { PermissionService } from '../permission-registry/permission.service.js';
import { TokenPair } from '../interface/auth.interface.js';
import { randomBytes, pbkdf2Sync, timingSafeEqual } from 'node:crypto';

@Injectable()
export class AuthUtilsService {
  private readonly iterations = 310000; // OWASP recommended
  private readonly keylen = 32; // 256-bit
  private readonly digest = 'sha256';

  constructor(
    private readonly jwt: JwtService,
    private readonly permissionService: PermissionService,
  ) {}

  hashPassword(password: string): string {
    const salt = randomBytes(16);
    const hash = pbkdf2Sync(
      password,
      salt,
      this.iterations,
      this.keylen,
      this.digest,
    );

    return `${this.iterations}:${salt.toString('hex')}:${hash.toString('hex')}`;
  }

  verifyPassword(plain: string, storedHash: string): void {
    const parts = storedHash.split(':');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Invalid stored hash');
    }

    const [iterationsStr, saltHex, hashHex] = parts;

    const iterations = parseInt(iterationsStr, 10);
    const salt = Buffer.from(saltHex, 'hex');
    const stored = Buffer.from(hashHex, 'hex');

    const derived = pbkdf2Sync(
      plain,
      salt,
      iterations,
      stored.length,
      this.digest,
    );

    if (!timingSafeEqual(stored, derived)) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  createActor(params: {
    id: string;
    principalType: PrincipalType;
    roleId?: string | null;
    departmentId?: string | null;
    isRoot?: boolean;
  }): AuthActor {
    return {
      id: params.id,
      principalType: params.principalType,
      isRoot: params.isRoot ?? false,
      roleId: params.roleId ?? null,
      departmentId: params.departmentId ?? null,
    };
  }

  generateTokens(actor: AuthActor): TokenPair {
    const payload = {
      sub: actor.id,
      principalType: actor.principalType,
      roleId: actor.roleId,
      departmentId: actor.departmentId,
      isRoot: actor.isRoot,
    };

    return {
      accessToken: this.jwt.sign(payload, { expiresIn: '1h' }),
      refreshToken: this.jwt.sign(payload, { expiresIn: '7d' }),
    };
  }

  generateRandomPassword(length = 10): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let res = '';
    const bytes = randomBytes(length);
    for (let i = 0; i < length; i += 1) {
      res += chars[bytes[i] % chars.length];
    }
    return res;
  }
  stripSensitive<T extends object>(obj: T, fields: string[]) {
    const clone = { ...obj } as any;
    for (const f of fields) delete clone[f];
    return clone as Omit<T, (typeof fields)[number]>;
  }

  async getEffectivePermissionStrings(actor: AuthActor): Promise<string[]> {
    const perms = await this.permissionService.getEffectivePermissions(actor);
    return perms.map((p) => p.permission);
  }
}
