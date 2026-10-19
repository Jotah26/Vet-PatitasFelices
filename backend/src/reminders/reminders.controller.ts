import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoleKey } from '../generated/prisma/client';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { STAFF_ROLES } from '../auth/staff-roles';
import { OptionalIntPipe } from '../clinical/optional-int.pipe';
import { RemindersService } from './reminders.service';

@Controller('reminders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleKey.OWNER, ...STAFF_ROLES)
export class RemindersController {
  constructor(private readonly reminders: RemindersService) {}

  @Get()
  findAll(@Req() req: AuthenticatedRequest, @Query('petId', OptionalIntPipe) petId?: number) {
    return this.reminders.list(req.user!, petId);
  }
}
