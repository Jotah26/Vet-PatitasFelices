import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { STAFF_ROLES } from '../auth/staff-roles';
import { RoleKey } from '../generated/prisma/client';
import { AppointmentRequestsService } from './appointment-requests.service';
import { AcceptAppointmentRequestDto } from './dto/accept-appointment-request.dto';
import { CreateAppointmentRequestDto } from './dto/create-appointment-request.dto';
import { RejectAppointmentRequestDto } from './dto/reject-appointment-request.dto';

@Controller('appointment-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentRequestsController {
  constructor(private readonly requests: AppointmentRequestsService) {}

  @Post()
  @Roles(RoleKey.OWNER)
  create(@Req() req: AuthenticatedRequest, @Body() data: CreateAppointmentRequestDto) {
    return this.requests.create(req.user!.sub, data);
  }

  @Get('staff')
  @Roles(...STAFF_ROLES)
  findAllForStaff() {
    return this.requests.findAllForStaff();
  }

  @Get()
  @Roles(RoleKey.OWNER)
  findMine(@Req() req: AuthenticatedRequest) {
    return this.requests.findMine(req.user!.sub);
  }

  @Post(':id/accept')
  @HttpCode(HttpStatus.OK)
  @Roles(...STAFF_ROLES)
  accept(@Param('id', ParseIntPipe) id: number, @Body() data: AcceptAppointmentRequestDto) {
    return this.requests.accept(id, data.veterinarianId);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @Roles(...STAFF_ROLES)
  reject(@Param('id', ParseIntPipe) id: number, @Body() data: RejectAppointmentRequestDto) {
    return this.requests.reject(id, data.rejectionReason);
  }
}
