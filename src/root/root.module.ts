import { Module } from '@nestjs/common';
import { RootService } from './services/root.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Root } from './entities/root.entity';
import { AuditLogModule } from 'src/common/audit-log/audit-log.module';
import { RootController } from './controllers/root.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Root,
      // RootWallet,
      // RootBankDetail,
      // RootCommissionEarning,
      // Role,
    ]),
    // forwardRef(() => RolesModule),
    // MailModule,
    AuditLogModule,
    // PassportModule,
    // JwtModule.register({
    //   secret: process.env.JWT_SECRET || 'secret',
    //   signOptions: { expiresIn: '1h' },
    // }),
  ],
  controllers: [RootController],
  providers: [RootService],
  exports: [RootService, SequelizeModule],
})
export class RootModule {}
