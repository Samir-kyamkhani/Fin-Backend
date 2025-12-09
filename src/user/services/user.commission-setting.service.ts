import { ForbiddenException, Injectable } from '@nestjs/common';

import { AuthActor } from '../../auth/interface/auth.interface';
import { AccessContextResolver } from '../../common/commission-setting/access/access-context.resolver';
import { CommissionSettingService } from '../../common/commission-setting/service/commission-setting.service';

@Injectable()
export class UserCommissionSettingService {
  constructor(
    private resolver: AccessContextResolver,
    private common: CommissionSettingService,
  ) {}

  async findAll(query, actor: AuthActor) {
    if (actor.principalType !== 'USER') {
      throw new ForbiddenException();
    }

    const ctx = await this.resolver.resolve(actor);
    return this.common.findAll(query, ctx);
  }
}
