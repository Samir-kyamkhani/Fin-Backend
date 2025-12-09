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
import { EmployeeSystemSettingService } from '../services/employee.system-setting.service';

@Controller('api/v1/user/system-setting')
@UseGuards(JwtAuthGuard)
export class EmployeeSystemSettingController {
  constructor(
    private readonly employeeSystemSettingService: EmployeeSystemSettingService,
  ) {}

  // ------------------- UPSERT -------------------
  @Post('upsert')
  upsert(@Req() req: Request, @Body() dto: UpsertSystemSettingDto) {
    const currentUser = req.user as AuthActor;
    return this.employeeSystemSettingService.upsertByEmployee(dto, currentUser);
  }

  // ------------------- GET ALL -------------------
  @Get('get-all')
  getAll(
    @Req() req: Request,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const currentUser = req.user as AuthActor;
    return this.employeeSystemSettingService.getAllByEmployee(
      currentUser,
      page,
      limit,
    );
  }

  // ------------------- GET BY ID -------------------
  @Get(':id')
  getById(@Req() req: Request, @Param('id') id: string) {
    const currentUser = req.user as AuthActor;
    return this.employeeSystemSettingService.getByIdEmployee(id, currentUser);
  }

  // ------------------- DELETE -------------------
  @Delete(':id')
  delete(@Req() req: Request, @Param('id') id: string) {
    const currentUser = req.user as AuthActor;
    return this.employeeSystemSettingService.deleteByEmployee(id, currentUser);
  }
}
