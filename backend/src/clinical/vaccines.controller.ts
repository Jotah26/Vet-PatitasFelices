import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { STAFF_ROLES } from '../auth/staff-roles';
import { ClinicalService } from './clinical.service';
import { CreateVaccineDto } from './dto/create-vaccine.dto';
import { OptionalIntPipe } from './optional-int.pipe';

@Controller('vaccines')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...STAFF_ROLES)
export class VaccinesController {
  constructor(private readonly clinical: ClinicalService) {}

  @Get()
  findAll(@Query('petId', OptionalIntPipe) petId?: number) {
    return this.clinical.listVaccines(petId);
  }

  @Post()
  create(@Body() data: CreateVaccineDto) {
    return this.clinical.createVaccine(data);
  }
}
