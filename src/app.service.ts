import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  getHealth(): { status: string; message: string } {
    const response = {
      status: 'ok',
      message: 'Everything is good!',
    };
    this.logger.log('Health check requested');
    return response;
  }
}
