import { Test, TestingModule } from '@nestjs/testing';
import { IpWhitelistService } from '../service/ip-whitelist.service';

describe('IpWhitelistService', () => {
  let service: IpWhitelistService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IpWhitelistService],
    }).compile();

    service = module.get<IpWhitelistService>(IpWhitelistService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
