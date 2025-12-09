import { Injectable } from '@nestjs/common';
import { SystemSettingService } from '../../common/system-setting/service/system-setting.service';
import { AuthActor } from '../../auth/interface/auth.interface';
import { UpsertSystemSettingDto } from '../../common/system-setting/dto/upsert-system-setting.dto';

@Injectable()
export class RootSystemSettingService {
  constructor(private readonly systemSettingService: SystemSettingService) {}

  // ROOT upsert
  upsertByRoot(dto: UpsertSystemSettingDto, currentUser: AuthActor) {
    return this.systemSettingService.upsert(currentUser, dto);
  }

  // GET ALL (with pagination)
  getAllByRoot(currentUser: AuthActor, page?: number, limit?: number) {
    return this.systemSettingService.getAll(currentUser, page, limit);
  }

  // GET BY ID
  getByIdRoot(id: string, currentUser: AuthActor) {
    return this.systemSettingService.getById(currentUser, id);
  }

  // DELETE
  deleteByRoot(id: string, currentUser: AuthActor) {
    return this.systemSettingService.delete(currentUser, id);
  }
}
