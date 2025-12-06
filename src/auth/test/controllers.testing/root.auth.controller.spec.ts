import { Test, TestingModule } from '@nestjs/testing';
import { RootAuthController } from '../../controllers/root.auth.controller.js';
import { RootAuthService } from '../../services/root.auth.service.js';

describe('RootAuthController', () => {
  let controller: RootAuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RootAuthController],
      providers: [RootAuthService],
    }).compile();

    controller = module.get<RootAuthController>(RootAuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
