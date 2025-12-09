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
import { RootSystemSettingService } from '../services/root.system-setting.service';
import type { Request } from 'express';
import { AuthActor } from '../../auth/interface/auth.interface';
import { UpsertSystemSettingDto } from '../../common/system-setting/dto/upsert-system-setting.dto';

@Controller('api/v1/root/system-setting')
@UseGuards(JwtAuthGuard)
export class RootSystemSettingController {
  constructor(
    private readonly rootSystemSettingService: RootSystemSettingService,
  ) {}

  // ------------------- UPSERT -------------------
  @Post('upsert')
  upsert(@Req() req: Request, @Body() dto: UpsertSystemSettingDto) {
    const currentUser = req.user as AuthActor;
    return this.rootSystemSettingService.upsertByRoot(dto, currentUser);
  }

  // ------------------- GET ALL -------------------
  @Get('get-all')
  getAll(
    @Req() req: Request,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const currentUser = req.user as AuthActor;
    return this.rootSystemSettingService.getAllByRoot(currentUser, page, limit);
  }

  // ------------------- GET BY ID -------------------
  @Get(':id')
  getById(@Req() req: Request, @Param('id') id: string) {
    const currentUser = req.user as AuthActor;
    return this.rootSystemSettingService.getByIdRoot(id, currentUser);
  }

  // ------------------- DELETE -------------------
  @Delete(':id')
  delete(@Req() req: Request, @Param('id') id: string) {
    const currentUser = req.user as AuthActor;
    return this.rootSystemSettingService.deleteByRoot(id, currentUser);
  }
}
