import { Module } from '@nestjs/common';
import { ApiWebhookService } from './service/api-webhook.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { ApiWebhook } from './entities/api-webhook.entity';
import { ApiEntity } from 'src/common/api-entity/entities/api-entity.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([ApiWebhook, ApiEntity /*Transaction*/]),
  ],
  providers: [ApiWebhookService],
  exports: [ApiWebhookService, SequelizeModule],
})
export class ApiWebhookModule {}
