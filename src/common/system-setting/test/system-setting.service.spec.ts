import { Test, TestingModule } from '@nestjs/testing';
import { SystemSettingService } from '../service/system-setting.service.js';

describe('SystemSettingService', () => {
  let service: SystemSettingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SystemSettingService],
    }).compile();

    service = module.get<SystemSettingService>(SystemSettingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
