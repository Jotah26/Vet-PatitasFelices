import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { MedicationCategory } from '../../generated/prisma/client';

export class UpdateMedicationDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsEnum(MedicationCategory)
  category?: MedicationCategory;

  @IsOptional()
  @IsString()
  @MinLength(1)
  presentation?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minStock?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  activeIngredient?: string;

  @IsOptional()
  @IsString()
  batch?: string;
}
