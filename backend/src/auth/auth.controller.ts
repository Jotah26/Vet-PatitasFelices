import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { RoleKey } from '../generated/prisma/client';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthenticatedRequest, JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  login(@Body() credentials: LoginDto) {
    return this.auth.login(credentials);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleKey.ADMINISTRATOR)
  getAdministratorResource(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  currentUser(@Req() request: AuthenticatedRequest) {
    return this.auth.currentUser(request.user!.sub);
  }
}
