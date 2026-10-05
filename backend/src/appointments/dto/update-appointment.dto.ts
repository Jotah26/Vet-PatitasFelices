import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class UpdateAppointmentDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  scheduledAt?: Date;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  petId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  veterinarianId?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  reason?: string;
}
