import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BusinessKycService } from './business-kyc.service';
import { CreateBusinessKycDto } from './dto/create-business-kyc.dto';
import { UpdateBusinessKycDto } from './dto/update-business-kyc.dto';

@Controller('business-kyc')
export class BusinessKycController {
  constructor(private readonly businessKycService: BusinessKycService) {}

  @Post()
  create(@Body() createBusinessKycDto: CreateBusinessKycDto) {
    return this.businessKycService.create(createBusinessKycDto);
  }

  @Get()
  findAll() {
    return this.businessKycService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.businessKycService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBusinessKycDto: UpdateBusinessKycDto) {
    return this.businessKycService.update(+id, updateBusinessKycDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.businessKycService.remove(+id);
  }
}
