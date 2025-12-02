import { Test, TestingModule } from '@nestjs/testing';
import { UserKycService } from '../service/user-kyc.service';

describe('UserKycService', () => {
  let service: UserKycService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserKycService],
    }).compile();

    service = module.get<UserKycService>(UserKycService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
