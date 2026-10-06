import { Type } from 'class-transformer';
import { IsDate, IsInt, IsString, Min, MinLength } from 'class-validator';

export class CreateAppointmentRequestDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  petId!: number;

  @Type(() => Date)
  @IsDate()
  scheduledAt!: Date;

  @IsString()
  @MinLength(1)
  reason!: string;
}
