import { Test, TestingModule } from '@nestjs/testing';
import { EmployeePermissionService } from '../service/employee-permission.service';

describe('EmployeePermissionService', () => {
  let service: EmployeePermissionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmployeePermissionService],
    }).compile();

    service = module.get<EmployeePermissionService>(EmployeePermissionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
