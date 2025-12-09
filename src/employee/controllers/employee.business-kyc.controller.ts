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
import { BusinessKycQueryDto } from '../../common/business-kyc/dto/business-kyc-query.dto';
import { VerifyBusinessKycDto } from '../../common/business-kyc/dto/verify-business-kyc.dto';
import { EmployeeBusinessKYCService } from '../services/employee.business-kyc.service';

@Controller('api/v1/employee/business-kyc')
@UseGuards(JwtAuthGuard)
export class EmployeeBusinessKYCController {
  constructor(
    private readonly businessKYCService: EmployeeBusinessKYCService,
  ) {}

  // ------------------- GET ALL -------------------
  @Get('get-all')
  findAll(@Req() req: Request, @Query() query: BusinessKycQueryDto) {
    const currentUser = req.user as AuthActor;
    return this.businessKYCService.getAllKYCByEmployee(query, currentUser);
  }

  // ------------------- GET BY ID -------------------
  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    return this.businessKYCService.getByIdEmployee(id);
  }

  // ------------------- DELETE -------------------
  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    const currentUser = req.user as AuthActor;
    return this.businessKYCService.deleteByEmployee(id, currentUser);
  }

  // ------------------- VERIFY -------------------
  @Patch(':id')
  verify(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: VerifyBusinessKycDto,
  ) {
    const currentUser = req.user as AuthActor;
    return this.businessKYCService.verifyByEmployee(id, dto, currentUser);
  }
}
