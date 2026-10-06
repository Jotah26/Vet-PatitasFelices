import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { STAFF_ROLES } from '../auth/staff-roles';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { StockQuantityDto } from './dto/stock-quantity.dto';
import { UpdateMedicationDto } from './dto/update-medication.dto';
import { MedicationsService } from './medications.service';

@Controller('medications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...STAFF_ROLES)
export class MedicationsController {
  constructor(private readonly medications: MedicationsService) {}

  @Post()
  create(@Body() data: CreateMedicationDto) {
    return this.medications.create(data);
  }

  @Get()
  findAll() {
    return this.medications.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.medications.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateMedicationDto) {
    return this.medications.update(id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.medications.remove(id);
  }

  @Post(':id/restock')
  @HttpCode(HttpStatus.OK)
  restock(@Param('id', ParseIntPipe) id: number, @Body() data: StockQuantityDto) {
    return this.medications.restock(id, data.quantity);
  }

  @Post(':id/dispense')
  @HttpCode(HttpStatus.OK)
  dispense(@Param('id', ParseIntPipe) id: number, @Body() data: StockQuantityDto) {
    return this.medications.dispense(id, data.quantity);
  }
}
