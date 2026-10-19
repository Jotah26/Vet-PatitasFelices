import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoleKey } from '../generated/prisma/client';
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

  @Get('mine')
  @Roles(RoleKey.OWNER)
  findMine(@Req() request: AuthenticatedRequest) {
    return this.clinical.listMyVaccines(request.user!.sub);
  }

  @Post()
  create(@Body() data: CreateVaccineDto) {
    return this.clinical.createVaccine(data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.clinical.removeVaccine(id);
  }
}
