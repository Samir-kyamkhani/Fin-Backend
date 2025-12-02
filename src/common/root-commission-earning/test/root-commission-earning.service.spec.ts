import { Test, TestingModule } from '@nestjs/testing';
import { RootCommissionEarningService } from '../service/root-commission-earning.service';

describe('RootCommissionEarningService', () => {
  let service: RootCommissionEarningService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RootCommissionEarningService],
    }).compile();

    service = module.get<RootCommissionEarningService>(RootCommissionEarningService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
