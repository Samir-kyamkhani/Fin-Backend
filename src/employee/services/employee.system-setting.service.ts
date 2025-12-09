import { Injectable } from '@nestjs/common';
import { SystemSettingService } from '../../common/system-setting/service/system-setting.service';
import { AuthActor } from '../../auth/interface/auth.interface';
import { UpsertSystemSettingDto } from '../../common/system-setting/dto/upsert-system-setting.dto';

@Injectable()
export class EmployeeSystemSettingService {
  constructor(private readonly systemSettingService: SystemSettingService) {}

  // ROOT upsert
  upsertByEmployee(dto: UpsertSystemSettingDto, currentUser: AuthActor) {
    return this.systemSettingService.upsert(currentUser, dto);
  }

  // GET ALL (with pagination)
  getAllByEmployee(currentUser: AuthActor, page?: number, limit?: number) {
    return this.systemSettingService.getAll(currentUser, page, limit);
  }

  // GET BY ID
  getByIdEmployee(id: string, currentUser: AuthActor) {
    return this.systemSettingService.getById(currentUser, id);
  }

  // DELETE
  deleteByEmployee(id: string, currentUser: AuthActor) {
    return this.systemSettingService.delete(currentUser, id);
  }
}
