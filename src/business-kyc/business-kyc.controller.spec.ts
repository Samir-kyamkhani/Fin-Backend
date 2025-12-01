import { Test, TestingModule } from '@nestjs/testing';
import { BusinessKycController } from './business-kyc.controller';
import { BusinessKycService } from './business-kyc.service';

describe('BusinessKycController', () => {
  let controller: BusinessKycController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BusinessKycController],
      providers: [BusinessKycService],
    }).compile();

    controller = module.get<BusinessKycController>(BusinessKycController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
