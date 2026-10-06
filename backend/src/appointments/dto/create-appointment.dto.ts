import { Type } from 'class-transformer';
import { IsDate, IsInt, IsString, Min, MinLength } from 'class-validator';

export class CreateAppointmentDto {
  @Type(() => Date)
  @IsDate()
  scheduledAt!: Date;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  petId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  veterinarianId!: number;

  @IsString()
  @MinLength(1)
  reason!: string;
}
