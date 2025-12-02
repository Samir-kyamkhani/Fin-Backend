import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RootService } from '../../root/services/root.service';
import { CreateRootDto } from '../../root/dto/create-root.dto';
import { UpdateRootDto } from '../../root/dto/update-root.dto';

@Controller('root')
export class RootController {
  constructor(private readonly rootService: RootService) {}

  @Post()
  create(@Body() createRootDto: CreateRootDto) {
    return this.rootService.create(createRootDto);
  }

  @Get()
  findAll() {
    return this.rootService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rootService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRootDto: UpdateRootDto) {
    return this.rootService.update(+id, updateRootDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rootService.remove(+id);
  }
}
