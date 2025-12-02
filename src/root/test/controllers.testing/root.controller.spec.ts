import { Test, TestingModule } from '@nestjs/testing';
import { RootController } from '../../controllers/root.controller';
import { RootService } from '../../services/root.service';

describe('RootController', () => {
  let controller: RootController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RootController],
      providers: [RootService],
    }).compile();

    controller = module.get<RootController>(RootController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
