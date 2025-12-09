import {
  Controller,
  Get,
  Post,
  Delete,
  UseGuards,
  Req,
  Query,
  Body,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import type { Request } from 'express';
import { AuthActor } from '../../auth/interface/auth.interface';
import { UpsertSystemSettingDto } from '../../common/system-setting/dto/upsert-system-setting.dto';
import { AdminSystemSettingService } from '../services/admin.system-setting.service';

@Controller('api/v1/user/system-setting')
@UseGuards(JwtAuthGuard)
export class AdminSystemSettingController {
  constructor(
    private readonly adminSystemSettingService: AdminSystemSettingService,
  ) {}

  // ------------------- UPSERT -------------------
  @Post('upsert')
  upsert(@Req() req: Request, @Body() dto: UpsertSystemSettingDto) {
    const currentUser = req.user as AuthActor;
    return this.adminSystemSettingService.upsertByAdmin(dto, currentUser);
  }

  // ------------------- GET ALL -------------------
  @Get('get-all')
  getAll(
    @Req() req: Request,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const currentUser = req.user as AuthActor;
    return this.adminSystemSettingService.getAllByAdmin(
      currentUser,
      page,
      limit,
    );
  }

  // ------------------- GET BY ID -------------------
  @Get(':id')
  getById(@Req() req: Request, @Param('id') id: string) {
    const currentUser = req.user as AuthActor;
    return this.adminSystemSettingService.getByIdAdmin(id, currentUser);
  }

  // ------------------- DELETE -------------------
  @Delete(':id')
  delete(@Req() req: Request, @Param('id') id: string) {
    const currentUser = req.user as AuthActor;
    return this.adminSystemSettingService.deleteByAdmin(id, currentUser);
  }
}
