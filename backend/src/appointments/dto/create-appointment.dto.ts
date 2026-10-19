import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

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

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  serviceId?: number;

  @IsString()
  @MinLength(1)
  reason!: string;
}
