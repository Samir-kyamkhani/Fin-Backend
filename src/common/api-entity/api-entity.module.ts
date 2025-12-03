import { Module } from '@nestjs/common';
import { ApiEntityService } from './service/api-entity.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { ApiEntity } from './entities/api-entity.entity';
import { User } from 'src/user/entities/user.entity';
import { ServiceProvider } from '../service-provider/entities/service-provider.entity';

@Module({
  imports: [SequelizeModule.forFeature([ApiEntity, User, ServiceProvider])],
  providers: [ApiEntityService],
  exports: [ApiEntityService, SequelizeModule],
})
export class ApiEntityModule {}
