import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { PrismaService } from '../../database/database.connection.js';
import { AuthActor } from '../types/principal.type.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles =
      this.reflector.get<string[]>(ROLES_KEY, context.getHandler()) ||
      this.reflector.get<string[]>(ROLES_KEY, context.getClass());

    if (!requiredRoles?.length) return true;

    const request = context.switchToHttp().getRequest();
    const actor: AuthActor | undefined = request.user;

    if (!actor) {
      throw new ForbiddenException('No authenticated user found');
    }

    // ROOT shortcut: assume ROOT role
    if (actor.isRoot) return true;

    // Only ROOT and USER have Role (by design)
    if (actor.principalType === 'EMPLOYEE') {
      throw new ForbiddenException('Employees do not have roles');
    }

    if (!actor.roleId) {
      throw new ForbiddenException('User has no role assigned');
    }

    const role = await this.prisma.role.findUnique({
      where: { id: actor.roleId },
      select: { name: true },
    });

    if (!role) {
      throw new ForbiddenException('Role not found');
    }

    if (!requiredRoles.includes(role.name)) {
      throw new ForbiddenException(
        `Required roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
