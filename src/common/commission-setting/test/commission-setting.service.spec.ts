import { Test, TestingModule } from '@nestjs/testing';
import { CommissionSettingService } from '../service/commission-setting.service.js';

describe('CommissionSettingService', () => {
  let service: CommissionSettingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommissionSettingService],
    }).compile();

    service = module.get<CommissionSettingService>(CommissionSettingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
