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

import { GetAllUserKycDto } from '../../common/user-kyc/dto/get-all-user-kyc.dto';
import { VerifyUserKycDto } from '../../common/user-kyc/dto/verify-user-kyc.dto';

import { RootUserKYCService } from '../services/root.user-kyc.service';

@Controller('api/v1/root/user-kyc')
@UseGuards(JwtAuthGuard)
export class RootUserKYCController {
  constructor(private readonly userKYCService: RootUserKYCService) {}

  // ------------------- GET ALL -------------------
  @Get('get-all')
  findAll(@Req() req: Request, @Query() query: GetAllUserKycDto) {
    const currentUser = req.user as AuthActor;
    return this.userKYCService.getAllKYCByRoot(query, currentUser);
  }

  // ------------------- GET BY ID -------------------
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userKYCService.getByIdRoot(id);
  }

  // ------------------- DELETE -------------------
  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    const currentUser = req.user as AuthActor;
    return this.userKYCService.deleteByRoot(id, currentUser);
  }

  // ------------------- VERIFY -------------------
  @Patch(':id')
  verify(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: VerifyUserKycDto,
  ) {
    const currentUser = req.user as AuthActor;
    return this.userKYCService.verifyByRoot(id, dto, currentUser);
  }
}
