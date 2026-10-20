import { Body, Controller, Post } from '@nestjs/common';
import { SetupAdministratorDto } from '../auth/dto/setup-administrator.dto';
import { SetupService } from './setup.service';

@Controller('setup')
export class SetupController {
  constructor(private readonly setup: SetupService) {}

  @Post('administrator')
  createAdministrator(@Body() data: SetupAdministratorDto) {
    return this.setup.createAdministrator(data);
  }
}
