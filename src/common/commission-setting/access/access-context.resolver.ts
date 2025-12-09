import { ForbiddenException, Injectable } from '@nestjs/common';
import { AuthActor } from '../../../auth/interface/auth.interface';
import { PrismaService } from '../../../database/database.connection';
import { AccessContext } from '../interfaces/access-context.interface';

@Injectable()
export class AccessContextResolver {
  constructor(private prisma: PrismaService) {}

  async resolve(actor: AuthActor): Promise<AccessContext> {
    if (actor.principalType === 'ROOT') {
      return {
        rootId: actor.id,
        mode: 'ROOT',
        ownerId: actor.id,
      };
    }

    if (actor.principalType === 'USER') {
      const user = await this.prisma.user.findUnique({
        where: { id: actor.id },
        select: { rootParentId: true },
      });

      if (!user?.rootParentId) {
        throw new ForbiddenException('Invalid admin-root mapping');
      }

      return {
        rootId: user.rootParentId,
        mode: 'ADMIN',
        ownerId: actor.id,
      };
    }

    // EMPLOYEE
    const emp = await this.prisma.employee.findUnique({
      where: { id: actor.id },
      select: {
        createdByRootId: true,
        createdByUserId: true,
      },
    });

    if (!emp) {
      throw new ForbiddenException('Invalid employee');
    }

    if (emp.createdByRootId && !emp.createdByUserId) {
      return {
        rootId: emp.createdByRootId,
        mode: 'ROOT',
        ownerId: emp.createdByRootId,
      };
    }

    return {
      rootId: emp.createdByRootId,
      mode: 'ADMIN',
      ownerId: emp.createdByUserId,
    };
  }
}
