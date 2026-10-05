import { IsString, MinLength } from 'class-validator';

export class RejectAppointmentRequestDto {
  @IsString()
  @MinLength(1)
  rejectionReason!: string;
}
