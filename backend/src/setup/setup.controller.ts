import { Body, Controller, HttpException, HttpStatus, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { SetupAdministratorDto } from '../auth/dto/setup-administrator.dto';
import { AuthThrottleService } from '../auth/auth-throttle.service';
import { SetupService } from './setup.service';

@Controller('setup')
export class SetupController {
  constructor(
    private readonly setup: SetupService,
    private readonly throttle: AuthThrottleService,
  ) {}

  @Post('administrator')
  async createAdministrator(@Body() data: SetupAdministratorDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const key = this.throttle.key(data.email, request.ip ?? request.socket.remoteAddress ?? 'unknown');
    const retryAfter = this.throttle.retryAfterSeconds(key);
    if (retryAfter !== null) {
      response.setHeader('Retry-After', retryAfter);
      throw new HttpException('Too many setup attempts. Try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }
    try {
      const result = await this.setup.createAdministrator(data);
      this.throttle.recordSuccess(key);
      return result;
    } catch (error) {
      this.throttle.recordFailure(key);
      throw error;
    }
  }
}
