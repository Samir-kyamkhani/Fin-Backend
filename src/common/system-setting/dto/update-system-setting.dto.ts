import { PartialType } from '@nestjs/mapped-types';
import { CreateSystemSettingDto } from './create-system-setting.dto.js';

export class UpdateSystemSettingDto extends PartialType(CreateSystemSettingDto) {}
