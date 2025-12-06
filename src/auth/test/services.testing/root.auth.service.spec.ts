import { Test, TestingModule } from '@nestjs/testing';
import { RootAuthService } from '../../services/root.auth.service';

describe('RootAuthService', () => {
  let service: RootAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RootAuthService],
    }).compile();

    service = module.get<RootAuthService>(RootAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
