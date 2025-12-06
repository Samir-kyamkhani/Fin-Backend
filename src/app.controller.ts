import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('api/v1/health')
  getHealth(): { status: string; message: string } {
    return this.appService.getHealth();
  }
}
