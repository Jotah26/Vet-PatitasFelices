import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { RoleKey } from '../generated/prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { STAFF_ROLES } from '../auth/staff-roles';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { CreateMyPetDto } from './dto/create-my-pet.dto';
import { UpdateMyPetDto } from './dto/update-my-pet.dto';
import { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { PetsService } from './pets.service';

@Controller('pets')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...STAFF_ROLES)
export class PetsController {
  constructor(private readonly pets: PetsService) {}

  @Get('mine')
  @Roles(RoleKey.OWNER)
  findMine(@Req() request: AuthenticatedRequest) {
    return this.pets.findMine(request.user!.sub);
  }

  @Post('mine')
  @Roles(RoleKey.OWNER)
  createMine(@Req() request: AuthenticatedRequest, @Body() data: CreateMyPetDto) {
    return this.pets.createMine(request.user!.sub, data);
  }

  @Get('mine/:id')
  @Roles(RoleKey.OWNER)
  findMineOne(@Req() request: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.pets.findMineOne(request.user!.sub, id);
  }

  @Patch('mine/:id')
  @Roles(RoleKey.OWNER)
  updateMine(@Req() request: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number, @Body() data: UpdateMyPetDto) {
    return this.pets.updateMine(request.user!.sub, id, data);
  }

  @Delete('mine/:id')
  @Roles(RoleKey.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMine(@Req() request: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.pets.removeMine(request.user!.sub, id);
  }

  @Post()
  create(@Body() data: CreatePetDto) {
    return this.pets.create(data);
  }

  @Get()
  findAll() {
    return this.pets.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pets.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdatePetDto) {
    return this.pets.update(id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.pets.remove(id);
  }
}
