import { Test, TestingModule } from '@nestjs/testing';
import { RootWalletService } from '../service/root-wallet.service';

describe('RootWalletService', () => {
  let service: RootWalletService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RootWalletService],
    }).compile();

    service = module.get<RootWalletService>(RootWalletService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
