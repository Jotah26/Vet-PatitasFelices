import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { MedicationCategory } from '../../generated/prisma/client';

export class CreateMedicationDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsEnum(MedicationCategory)
  category!: MedicationCategory;

  @IsString()
  @MinLength(1)
  presentation!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  minStock!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsString()
  activeIngredient?: string;

  @IsOptional()
  @IsString()
  batch?: string;
}
