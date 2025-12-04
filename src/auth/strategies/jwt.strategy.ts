import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../database/database.connection.js';
import { JwtPayload, AuthActor } from '../types/principal.type.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.ACCESS_TOKEN_SECRET!,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthActor> {
    const { sub, principalType } = payload;

    if (!sub || !principalType) {
      throw new UnauthorizedException('Invalid token structure');
    }

    // ROOT
    if (principalType === 'ROOT') {
      const root = await this.prisma.root.findUnique({
        where: { id: sub },
        select: { id: true, roleId: true, status: true, deletedAt: true },
      });

      if (!root || root.deletedAt || root.status !== 'ACTIVE') {
        throw new UnauthorizedException('Root not found or inactive');
      }

      return {
        id: root.id,
        principalType,
        isRoot: true,
        roleId: root.roleId,
      };
    }

    // USER
    if (principalType === 'USER') {
      const user = await this.prisma.user.findUnique({
        where: { id: sub },
        select: { id: true, roleId: true, status: true, deletedAt: true },
      });

      if (!user || user.deletedAt || user.status !== 'ACTIVE') {
        throw new UnauthorizedException('User inactive');
      }

      return {
        id: user.id,
        principalType,
        isRoot: false,
        roleId: user.roleId,
      };
    }

    // EMPLOYEE
    if (principalType === 'EMPLOYEE') {
      const employee = await this.prisma.employee.findUnique({
        where: { id: sub },
        select: {
          id: true,
          departmentId: true,
          status: true,
          deletedAt: true,
        },
      });

      if (!employee || employee.deletedAt || employee.status !== 'ACTIVE') {
        throw new UnauthorizedException('Employee inactive');
      }

      return {
        id: employee.id,
        principalType,
        isRoot: false,
        departmentId: employee.departmentId,
      };
    }

    throw new UnauthorizedException('Unknown principal type');
  }
}
