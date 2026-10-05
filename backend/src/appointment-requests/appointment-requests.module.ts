import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AppointmentRequestsController } from './appointment-requests.controller';
import { AppointmentRequestsService } from './appointment-requests.service';

@Module({
  imports: [AuthModule],
  controllers: [AppointmentRequestsController],
  providers: [AppointmentRequestsService],
})
export class AppointmentRequestsModule {}
