import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { STAFF_ROLES } from '../auth/staff-roles';
import { ClinicalService } from './clinical.service';
import { OptionalIntPipe } from './optional-int.pipe';

@Controller('consultations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...STAFF_ROLES)
export class ConsultationsController {
  constructor(private readonly clinical: ClinicalService) {}

  @Get()
  findAll(@Query('petId', OptionalIntPipe) petId?: number) {
    return this.clinical.listConsultations(petId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clinical.getConsultation(id);
  }
}
