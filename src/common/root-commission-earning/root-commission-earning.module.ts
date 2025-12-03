import { Module } from '@nestjs/common';
import { RootCommissionEarningService } from './service/root-commission-earning.service';
import { RootCommissionEarning } from './entities/root-commission-earning.entity';
import { SequelizeModule } from '@nestjs/sequelize';
import { Root } from 'src/root/entities/root.entity';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [SequelizeModule.forFeature([RootCommissionEarning, Root, User])],
  providers: [RootCommissionEarningService],
  exports: [RootCommissionEarningService, SequelizeModule],
})
export class RootCommissionEarningModule {}
