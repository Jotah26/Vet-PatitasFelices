import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { STAFF_ROLES } from '../auth/staff-roles';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...STAFF_ROLES)
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post()
  create(@Body() data: CreatePaymentDto) { return this.payments.create(data); }

  @Get()
  findAll() { return this.payments.findAll(); }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.payments.findOne(id); }

  @Post(':id/void')
  @HttpCode(HttpStatus.OK)
  void(@Param('id', ParseIntPipe) id: number) { return this.payments.void(id); }
}
