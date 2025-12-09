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
import { RootBusinessKYCService } from '../services/root.business-kyc.service';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { AuthActor } from '../../auth/interface/auth.interface';
import type { Request } from 'express';
import { BusinessKycQueryDto } from '../../common/business-kyc/dto/business-kyc-query.dto';
import { VerifyBusinessKycDto } from '../../common/business-kyc/dto/verify-business-kyc.dto';

@Controller('api/v1/root/business-kyc')
@UseGuards(JwtAuthGuard)
export class RootBusinessKYCController {
  constructor(private readonly businessKYCService: RootBusinessKYCService) {}

  // ------------------- GET ALL -------------------
  @Get('get-all')
  findAll(@Req() req: Request, @Query() query: BusinessKycQueryDto) {
    const currentUser = req.user as AuthActor;
    return this.businessKYCService.getAllKYCByRoot(query, currentUser);
  }

  // ------------------- GET BY ID -------------------
  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    return this.businessKYCService.getByIdRoot(id);
  }

  // ------------------- DELETE -------------------
  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    const currentUser = req.user as AuthActor;
    return this.businessKYCService.deleteByRoot(id, currentUser);
  }

  // ------------------- VERIFY -------------------
  @Patch(':id')
  verify(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: VerifyBusinessKycDto,
  ) {
    const currentUser = req.user as AuthActor;
    return this.businessKYCService.verifyByRoot(id, dto, currentUser);
  }
}
