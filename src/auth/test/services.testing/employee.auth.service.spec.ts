import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';

describe('EmployeeAuthService', () => {
  let service: EmployeeAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    service = module.get<EmployeeAuthService>(EmployeeAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
