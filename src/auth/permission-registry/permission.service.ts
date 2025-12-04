import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { AuthActor } from '../types/principal.type.js';
import { PrismaService } from '../../database/database.connection.js';

export interface EffectivePermission {
  permission: string;
  serviceId: string | null; // null = global
  source: 'role' | 'user' | 'department' | 'employee';
}

@Injectable()
export class PermissionService {
  private readonly CACHE_TTL_SECONDS = 300; // 5 min

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  private cacheKey(actor: AuthActor): string {
    return `perm:${actor.principalType}:${actor.id}`;
  }

  async getEffectivePermissions(
    actor: AuthActor,
  ): Promise<EffectivePermission[]> {
    // ROOT: we technically don't need permissions, guard will bypass
    if (actor.isRoot) {
      return [];
    }

    const key = this.cacheKey(actor);
    const cached = await this.cache.get<EffectivePermission[]>(key);
    if (cached) return cached;

    let effective: EffectivePermission[] = [];

    if (actor.principalType === 'USER') {
      effective = await this.getBusinessUserPermissions(actor);
    } else if (actor.principalType === 'EMPLOYEE') {
      effective = await this.getEmployeePermissions(actor);
    }

    await this.cache.set(key, effective, this.CACHE_TTL_SECONDS * 1000);
    return effective;
  }

  // -------- BUSINESS USER (Role + User overrides) --------
  private async getBusinessUserPermissions(
    actor: AuthActor,
  ): Promise<EffectivePermission[]> {
    if (!actor.roleId) return [];

    const [rolePerms, userPerms] = await Promise.all([
      this.prisma.rolePermission.findMany({
        where: {
          roleId: actor.roleId,
          isActive: true,
          revokedAt: null,
        },
        select: {
          permission: true,
          serviceId: true,
        },
      }),
      this.prisma.userPermission.findMany({
        where: {
          userId: actor.id,
          isActive: true,
          revokedAt: null,
        },
        select: {
          permission: true,
          serviceId: true,
        },
      }),
    ]);

    const base = rolePerms.map((p) => ({
      permission: p.permission,
      serviceId: p.serviceId,
      source: 'role' as const,
    }));

    const overrides = userPerms.map((p) => ({
      permission: p.permission,
      serviceId: p.serviceId,
      source: 'user' as const,
    }));

    return this.mergePermissions(base, overrides);
  }

  // -------- EMPLOYEE (Department + Employee overrides) --------
  private async getEmployeePermissions(
    actor: AuthActor,
  ): Promise<EffectivePermission[]> {
    if (!actor.departmentId) return [];

    const [deptPerms, empPerms] = await Promise.all([
      this.prisma.departmentPermission.findMany({
        where: {
          departmentId: actor.departmentId,
          isActive: true,
          revokedAt: null,
        },
        select: {
          permission: true,
        },
      }),
      this.prisma.employeePermission.findMany({
        where: {
          employeeId: actor.id,
          isActive: true,
          revokedAt: null,
        },
        select: {
          permission: true,
        },
      }),
    ]);

    const base = deptPerms.map((p) => ({
      permission: p.permission,
      serviceId: null,
      source: 'department' as const,
    }));

    const overrides = empPerms.map((p) => ({
      permission: p.permission,
      serviceId: null,
      source: 'employee' as const,
    }));

    return this.mergePermissions(base, overrides);
  }

  // -------- Merge Logic (base + overrides with serviceId support) --------
  private mergePermissions(
    base: EffectivePermission[],
    overrides: EffectivePermission[],
  ): EffectivePermission[] {
    const map = new Map<string, EffectivePermission>();

    for (const p of base) {
      const key = this.permKey(p.permission, p.serviceId);
      map.set(key, p);
    }

    for (const p of overrides) {
      const key = this.permKey(p.permission, p.serviceId);
      map.set(key, p); // override or add
    }

    return Array.from(map.values());
  }

  private permKey(permission: string, serviceId: string | null): string {
    return `${permission}::${serviceId ?? 'global'}`;
  }

  // -------- Checkers used by Guards --------

  async hasPermission(
    actor: AuthActor,
    permission: string,
    serviceId?: string | null,
  ): Promise<boolean> {
    if (actor.isRoot) return true;

    const perms = await this.getEffectivePermissions(actor);

    return perms.some((p) => {
      if (p.permission !== permission) return false;
      // service-level logic:
      // - if serviceId is null -> any (global or specific) is ok
      // - if serviceId is provided:
      //    - match exact
      //    - or global (null) also counts as generic permission
      if (serviceId == null) return true;
      return p.serviceId === null || p.serviceId === serviceId;
    });
  }

  async hasAllPermissions(
    actor: AuthActor,
    permissions: string[],
    serviceId?: string | null,
  ): Promise<boolean> {
    for (const perm of permissions) {
      const ok = await this.hasPermission(actor, perm, serviceId);
      if (!ok) return false;
    }
    return true;
  }
}
