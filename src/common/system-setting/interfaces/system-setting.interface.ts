import { SettingScope } from '../enums/system-setting.enum';

export interface SystemSetting {
  id: string;
  scope: SettingScope;

  companyName?: string | null;
  companyLogo?: string | null;
  favIcon?: string | null;
  phoneNumber?: string | null;
  whatsappNumber?: string | null;
  companyEmail?: string | null;

  settings?: Record<string, any> | null;

  rootId?: string | null;
  userId?: string | null;

  updatedBy: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface SystemSettingFileMap {
  companyLogo: Express.Multer.File | null;
  favIcon: Express.Multer.File | null;
}
