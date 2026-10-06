import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { STAFF_ROLES } from '../auth/staff-roles';
import { ClinicalService } from './clinical.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { OptionalIntPipe } from './optional-int.pipe';

@Controller('prescriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...STAFF_ROLES)
export class PrescriptionsController {
  constructor(private readonly clinical: ClinicalService) {}

  @Get()
  findAll(@Query('petId', OptionalIntPipe) petId?: number) {
    return this.clinical.listPrescriptions(petId);
  }

  @Post()
  create(@Body() data: CreatePrescriptionDto) {
    return this.clinical.createPrescription(data);
  }
}
