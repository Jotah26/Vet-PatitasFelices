import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateVaccineDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  petId!: number;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  consultationId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  administeredById?: number;

  @IsOptional()
  @IsString()
  batch?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  nextDueAt?: Date;
}
