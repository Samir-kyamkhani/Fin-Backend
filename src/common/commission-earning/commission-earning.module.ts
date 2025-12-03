import { Module } from '@nestjs/common';
import { CommissionEarningService } from './service/commission-earning.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { CommissionEarning } from './entities/commission-earning.entity';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [SequelizeModule.forFeature([CommissionEarning, User])],
  providers: [CommissionEarningService],
  exports: [CommissionEarningService, SequelizeModule],
})
export class CommissionEarningModule {}
