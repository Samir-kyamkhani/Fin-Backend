import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeAuthController } from '../../controllers/employee.auth.controller';
import { EmployeeAuthService } from '../../services/employee.auth.service';

describe('EmployeeAuthController', () => {
  let controller: EmployeeAuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeAuthController],
      providers: [EmployeeAuthService],
    }).compile();

    controller = module.get<EmployeeAuthController>(EmployeeAuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
