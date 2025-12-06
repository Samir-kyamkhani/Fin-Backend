import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, pbkdf2Sync, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import {
  AuthActor,
  JwtPayload,
  PrincipalType,
} from '../interface/auth.interface.js';
import { PermissionService } from '../permission-registry/permission.service.js';
import { AuditLogService } from '../../common/audit-log/service/audit-log.service.js';
import { AuditStatus } from '../../common/audit-log/enums/audit-log.enum.js';

@Injectable()
export class AuthUtilsService {
  private readonly iterations = 310000; // OWASP recommended
  private readonly keylen = 32; // 256-bit
  private readonly digest = 'sha256';
  private readonly logger = new Logger(AuthUtilsService.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly permissionService: PermissionService,
    private readonly auditLogService: AuditLogService,
  ) {}

  hashPassword(password: string): string {
    const salt = randomBytes(16);
    const iterations = 100000;
    const keylen = 64;
    const digest = 'sha512';

    const hash = pbkdf2Sync(password, salt, iterations, keylen, digest);

    return `${iterations}:${salt.toString('hex')}:${hash.toString('hex')}`;
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
      'sha512',
    );

    if (!timingSafeEqual(stored, derived)) {
      throw new UnauthorizedException('Invalid sss credentials');
    }
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

  // ========== JWT / ACTOR ==========

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

  generateTokens(actor: AuthActor) {
    const payload: JwtPayload = {
      sub: actor.id,
      principalType: actor.principalType,
      roleId: actor.roleId ?? null,
      departmentId: actor.departmentId ?? null,
      isRoot: actor.isRoot ?? false,
    };

    return {
      accessToken: this.jwt.sign(payload, { expiresIn: '1h' }),
      refreshToken: this.jwt.sign(payload, { expiresIn: '7d' }),
    };
  }

  stripSensitive<T extends object>(obj: T, fields: string[]) {
    const clone = { ...(obj as any) };
    for (const f of fields) delete clone[f];
    return clone as Omit<T, (typeof fields)[number]>;
  }

  async getEffectivePermissionStrings(actor: AuthActor): Promise<string[]> {
    const perms = await this.permissionService.getEffectivePermissions(actor);
    return perms.map((p) => p.permission);
  }

  getClientIp(req: Request): string | null {
    const forwarded = req.headers['x-forwarded-for'];

    let ip: string | undefined;

    if (typeof forwarded === 'string') {
      ip = forwarded.split(',')[0]?.trim();
    } else if (Array.isArray(forwarded)) {
      ip = forwarded[0]?.trim();
    } else if (req.socket?.remoteAddress) {
      ip = req.socket.remoteAddress;
    }

    if (
      !ip ||
      ip.startsWith('127.') ||
      ip === '::1' ||
      ip.startsWith('192.168.') ||
      ip.startsWith('10.')
    ) {
      return null;
    }

    return ip;
  }

  getClientOrigin(req: Request): string | null {
    return (req.get('origin') || req.get('Origin')) ?? null;
  }

  getClientUserAgent(req: Request): string | null {
    return (req.headers['user-agent'] as string) ?? undefined;
  }

  private isIpInCidrRange(ip: string, cidr: string): boolean {
    try {
      const [range, bits] = cidr.split('/');
      const mask = ~(0xffffffff >>> parseInt(bits, 10));

      const ipLong = this.ipToLong(ip);
      const rangeLong = this.ipToLong(range);

      return (ipLong & mask) === (rangeLong & mask);
    } catch {
      return false;
    }
  }

  private ipToLong(ip: string): number {
    return (
      ip
        .split('.')
        .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0
    );
  }

  private isLocalEnvironment(clientIp: string, allowedIps: string[]): boolean {
    const isLocalIp =
      clientIp.startsWith('127.') ||
      clientIp.startsWith('192.168.') ||
      clientIp.startsWith('10.') ||
      clientIp === '::1';

    const hasLocalWhitelist = allowedIps.some(
      (ip) =>
        ip.startsWith('127.') ||
        ip.startsWith('192.168.') ||
        ip.startsWith('10.') ||
        ip === '::1',
    );

    return isLocalIp && hasLocalWhitelist;
  }

  isValidOriginForRoot(
    clientOrigin: string | null,
    allowedDomains: string[],
  ): boolean {
    if (!clientOrigin) {
      return true;
    }

    const domains = allowedDomains.filter((d) => d && d.trim() !== '');
    if (!domains.length) return true;

    let clientHostname: string;
    let clientProtocol: string;

    try {
      const clientUrl = new URL(clientOrigin);
      clientHostname = clientUrl.hostname;
      clientProtocol = clientUrl.protocol;
    } catch {
      return false;
    }

    return domains.some((domain) => {
      try {
        const domainUrl = new URL(domain);
        const domainHostname = domainUrl.hostname;
        const domainProtocol = domainUrl.protocol;

        if (domainProtocol !== clientProtocol) {
          return false;
        }

        if (domainHostname === clientHostname) return true;

        if (domainHostname.startsWith('*.')) {
          const base = domainHostname.substring(2);
          return clientHostname === base || clientHostname.endsWith(`.${base}`);
        }

        return false;
      } catch {
        // bare hostname / wildcard
        if (domain.startsWith('*.')) {
          const base = domain.substring(2);
          return clientHostname === base || clientHostname.endsWith(`.${base}`);
        }
        return domain === clientHostname;
      }
    });
  }

  isValidIpForRoot(clientIp: string | null, allowedIps: string[]): boolean {
    if (!clientIp || !allowedIps.length) return true;

    const clean = allowedIps.filter((ip) => ip && ip.trim() !== '');
    if (!clean.length) return true;

    if (clean.includes(clientIp)) return true;

    const inCidr = clean.some((ipRange) => {
      if (!ipRange.includes('/')) return false;
      return this.isIpInCidrRange(clientIp, ipRange);
    });

    if (inCidr) return true;

    if (this.isLocalEnvironment(clientIp, clean)) return true;

    return false;
  }

  getAuthActionDescription(action: string, userType: string): string {
    const map: Record<string, string> = {
      LOGIN_SUCCESS: `${userType} logged in successfully`,
      LOGIN_FAILED: `${userType} login attempt failed`,
      LOGOUT: `${userType} logged out`,
      REFRESH_TOKEN_SUCCESS: `${userType} token refreshed`,
      REFRESH_TOKEN_INVALID: `${userType} refresh token invalid`,
      PASSWORD_RESET_REQUESTED: `${userType} password reset requested`,
      PASSWORD_RESET_CONFIRMATION_FAILED: `${userType} password reset failed`,
      PASSWORD_RESET_CONFIRMED: `${userType} password reset confirmed`,
      CREDENTIALS_UPDATED: `${userType} credentials updated`,
      PROFILE_UPDATED: `${userType} profile updated`,
      PROFILE_IMAGE_UPDATED: `${userType} profile image updated`,
      DASHBOARD_ACCESSED: `${userType} dashboard accessed`,
    };

    return map[action] ?? `${userType} performed ${action}`;
  }

  async createAuthAuditLog(params: {
    performerType: PrincipalType;
    performerId: string | null;
    targetUserType?: string | null;
    targetUserId?: string | null;
    action: string;
    description?: string;
    resourceType?: string;
    resourceId?: string | null;
    status: AuditStatus;
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: Record<string, any>;
  }) {
    try {
      await this.auditLogService.create({
        performerType: params.performerType,
        performerId: params.performerId ?? '',
        targetUserType: params.targetUserType ?? params.performerType,
        targetUserId: params.targetUserId ?? params.performerId ?? '',
        action: params.action,
        description:
          params.description ??
          this.getAuthActionDescription(params.action, params.performerType),
        resourceType: params.resourceType ?? 'AUTH',
        resourceId: params.resourceId ?? params.performerId ?? '',
        status: params.status,
        ipAddress: params.ipAddress ?? undefined,
        userAgent: params.userAgent ?? undefined,
        metadata: params.metadata ?? {},
      });
    } catch (err) {
      this.logger.error('Auth log error', err);
    }
  }
}
