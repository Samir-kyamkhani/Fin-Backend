import { Module } from '@nestjs/common';
import { ApiIntigrationService } from './service/api-intigration.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { ApiIntegration } from './entities/api-intigration.entity';
import { Root } from 'src/root/entities/root.entity';
import { ServiceProvider } from '../service-provider/entities/service-provider.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([ApiIntegration, ServiceProvider, Root]),
  ],
  providers: [ApiIntigrationService],
  exports: [ApiIntigrationService],
})
export class ApiIntigrationModule {}
