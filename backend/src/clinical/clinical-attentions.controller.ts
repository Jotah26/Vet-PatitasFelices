import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { STAFF_ROLES } from '../auth/staff-roles';
import { ClinicalService } from './clinical.service';
import { RegisterAttentionDto } from './dto/register-attention.dto';

@Controller('clinical')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClinicalAttentionsController {
  constructor(private readonly clinical: ClinicalService) {}

  @Post('attentions')
  @Roles(...STAFF_ROLES)
  register(@Body() data: RegisterAttentionDto) {
    return this.clinical.registerAttention(data);
  }
}
