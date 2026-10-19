import { Body, Controller, Get, HttpException, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { RoleKey } from '../generated/prisma/client';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterOwnerDto } from './dto/register-owner.dto';
import { AuthenticatedRequest, JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { AuthThrottleService } from './auth-throttle.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly throttle: AuthThrottleService,
  ) {}

  @Post('login')
  async login(@Body() credentials: LoginDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const key = this.throttle.key(credentials.email, request.ip ?? request.socket.remoteAddress ?? 'unknown');
    this.assertAllowed(key, response);
    try {
      const result = await this.auth.login(credentials);
      this.throttle.recordSuccess(key);
      return result;
    } catch (error) {
      this.throttle.recordFailure(key);
      throw error;
    }
  }

  @Post('register-owner')
  async registerOwner(@Body() data: RegisterOwnerDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const key = this.throttle.key(data.email, request.ip ?? request.socket.remoteAddress ?? 'unknown');
    this.assertAllowed(key, response);
    try {
      const result = await this.auth.registerOwner(data);
      this.throttle.recordSuccess(key);
      return result;
    } catch (error) {
      this.throttle.recordFailure(key);
      throw error;
    }
  }

  private assertAllowed(key: string, response: Response): void {
    const retryAfter = this.throttle.retryAfterSeconds(key);
    if (retryAfter === null) return;
    response.setHeader('Retry-After', retryAfter);
    throw new HttpException('Too many attempts. Try again later.', HttpStatus.TOO_MANY_REQUESTS);
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
