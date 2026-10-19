import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { RoleKey } from '../generated/prisma/client';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleKey.ADMINISTRATOR)
export class UsersController {
  constructor(private readonly users: UsersService) {}
  @Get() findAll() { return this.users.findAll(); }
  @Post() create(@Body() data: CreateUserDto) { return this.users.create(data); }
  @Patch(':id') update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateUserDto, @Req() request: AuthenticatedRequest) { return this.users.update(id, data, request.user!.sub); }
  @Delete(':id') remove(@Param('id', ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) { return this.users.remove(id, request.user!.sub); }
}
