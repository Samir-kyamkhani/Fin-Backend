import { Module } from '@nestjs/common';
import { EmployeeAuthService } from './services/employee.auth.service';
import { EmployeeAuthController } from './controllers/employee.auth.controller';

@Module({
  imports: [
    // PassportModule,
    // JwtModule.register({
    //   secret: process.env.JWT_SECRET || 'secret',
    //   signOptions: { expiresIn: '1h' },
    // }),
  ],
  controllers: [EmployeeAuthController],
  providers: [EmployeeAuthService],
})
export class AuthModule {}
