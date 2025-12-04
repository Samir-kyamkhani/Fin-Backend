import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthActor } from '../types/principal.type.js';
import { PermissionService } from '../permission-registry/permission.service.js';
import { PERMISSIONS_KEY } from '../decorators/permission.decorator.js';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPerms =
      this.reflector.get<string[]>(PERMISSIONS_KEY, context.getHandler()) ||
      this.reflector.get<string[]>(PERMISSIONS_KEY, context.getClass());

    if (!requiredPerms?.length) return true;

    const request = context.switchToHttp().getRequest();
    const actor: AuthActor | undefined = request.user;

    if (!actor) {
      throw new ForbiddenException('Authentication required');
    }

    // ROOT short-circuit
    if (actor.isRoot) return true;

    // Optional: resolve serviceId from params or body
    const rawServiceId =
      (request.params?.serviceId as string | undefined) ??
      (request.params?.id as string | undefined) ??
      (request.body?.serviceId as string | undefined) ??
      null;

    const serviceId: string | null = rawServiceId;

    const hasAll = await this.permissionService.hasAllPermissions(
      actor,
      requiredPerms,
      serviceId,
    );

    if (!hasAll) {
      throw new ForbiddenException(
        `Missing permissions: ${requiredPerms.join(', ')}`,
      );
    }

    return true;
  }
}
