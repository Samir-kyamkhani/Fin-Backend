import {
  Controller,
  Patch,
  Param,
  UseGuards,
  Req,
  Body,
  Post,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { AuthActor } from '../../auth/interface/auth.interface';
import type { Request } from 'express';
import { AdminBusinessKYCService } from '../services/admin-business-kyc.service';
import { CreateBusinessKycDto } from '../../common/business-kyc/dto/create-business-kyc.dto';
import { UpdateBusinessKycDto } from '../../common/business-kyc/dto/update-business-kyc.dto';

@Controller('api/v1/user/business-kyc')
@UseGuards(JwtAuthGuard)
export class AdminBusinessKYCController {
  constructor(private readonly businessKYCService: AdminBusinessKYCService) {}

  // ------------------- Create KYC -------------------
  @Post('create')
  create(@Req() req: Request, @Body() bodyData: CreateBusinessKycDto) {
    const currentUser = req.user as AuthActor;
    const files = req.files as Express.Multer.File[];
    return this.businessKYCService.createByAdmin(bodyData, currentUser, files);
  }

  // ------------------- Update KYC -------------------
  @Patch(':id')
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() bodyData: UpdateBusinessKycDto,
  ) {
    const currentUser = req.user as AuthActor;
    const files = req.files as Express.Multer.File[];
    return this.businessKYCService.updateByAdmin(
      id,
      bodyData,
      currentUser,
      files,
    );
  }
}
