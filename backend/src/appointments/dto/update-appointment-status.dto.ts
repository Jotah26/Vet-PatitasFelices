import { IsEnum } from 'class-validator';
import { AppointmentStatus } from '../../generated/prisma/client';

export class UpdateAppointmentStatusDto {
  @IsEnum(AppointmentStatus)
  status!: AppointmentStatus;
}
