import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class AcceptAppointmentRequestDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  veterinarianId!: number;
}
