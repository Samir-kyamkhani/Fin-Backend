import {
  Controller,
  Get,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  Body,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { AuthActor } from '../../auth/interface/auth.interface';
import type { Request } from 'express';
import { EmployeeUserKYCService } from '../services/employee.user-kyc.service';
import { GetAllUserKycDto } from '../../common/user-kyc/dto/get-all-user-kyc.dto';
import { VerifyUserKycDto } from '../../common/user-kyc/dto/verify-user-kyc.dto';

@Controller('api/v1/employee/user-kyc')
@UseGuards(JwtAuthGuard)
export class employeeUserKYCController {
  constructor(private readonly userKYCService: EmployeeUserKYCService) {}

  // ------------------- GET ALL -------------------
  @Get('get-all')
  findAll(@Req() req: Request, @Query() query: GetAllUserKycDto) {
    const currentUser = req.user as AuthActor;
    return this.userKYCService.getAllKYCByEmployee(query, currentUser);
  }

  // ------------------- GET BY ID -------------------
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userKYCService.getByIdEmployee(id);
  }

  // ------------------- DELETE -------------------
  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    const currentUser = req.user as AuthActor;
    return this.userKYCService.deleteByEmployee(id, currentUser);
  }

  // ------------------- VERIFY -------------------
  @Patch(':id')
  verify(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: VerifyUserKycDto,
  ) {
    const currentUser = req.user as AuthActor;
    return this.userKYCService.verifyByEmployee(id, dto, currentUser);
  }
}
