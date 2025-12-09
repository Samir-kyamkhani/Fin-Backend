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
import { UserUserKYCService } from '../services/user.user-kyc.service';

@Controller('api/v1/user/user-kyc')
@UseGuards(JwtAuthGuard)
export class UserUserKYCController {
  constructor(private readonly userKYCService: UserUserKYCService) {}

  // ------------------- GET ALL -------------------
  @Get('get-all')
  findAll(@Req() req: Request, @Query() query: GetAllUserKycDto) {
    const currentUser = req.user as AuthActor;
    return this.userKYCService.getAllKYCByUser(query, currentUser);
  }

  // ------------------- GET BY ID -------------------
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userKYCService.getByIdUser(id);
  }

  // ------------------- DELETE -------------------
  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    const currentUser = req.user as AuthActor;
    return this.userKYCService.deleteByUser(id, currentUser);
  }

  // ------------------- VERIFY -------------------
  @Patch(':id')
  verify(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: VerifyUserKycDto,
  ) {
    const currentUser = req.user as AuthActor;
    return this.userKYCService.verifyByUser(id, dto, currentUser);
  }
}
