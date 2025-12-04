import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentPermissionService } from '../service/department-permission.service.js';

describe('DepartmentPermissionService', () => {
  let service: DepartmentPermissionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DepartmentPermissionService],
    }).compile();

    service = module.get<DepartmentPermissionService>(
      DepartmentPermissionService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
