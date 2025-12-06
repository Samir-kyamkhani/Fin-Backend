import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let mockAppService: { getHealth: jest.Mock };

  beforeEach(async () => {
    mockAppService = {
      getHealth: jest.fn().mockReturnValue({
        status: 'ok',
        message: 'Everything is good!',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
      ],
    }).compile();

    appController = module.get<AppController>(AppController);
  });

  describe('GET /health', () => {
    it('should return health status object', () => {
      const result = appController.getHealth();

      expect(mockAppService.getHealth).toHaveBeenCalled();
      expect(result).toEqual({
        status: 'ok',
        message: 'Everything is good!',
      });
    });
  });
});
