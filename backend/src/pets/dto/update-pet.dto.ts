import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { PetSex, PetSpecies } from '../../generated/prisma/client';

export class UpdatePetDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsEnum(PetSpecies)
  species?: PetSpecies;

  @IsOptional()
  @IsString()
  @MinLength(1)
  breed?: string;

  @IsOptional()
  @IsEnum(PetSex)
  sex?: PetSex;

  @IsOptional()
  @IsString()
  @MinLength(1)
  age?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  color?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  weight?: string;

  @IsOptional()
  @IsBoolean()
  isNeutered?: boolean;

  @IsOptional()
  @IsString()
  medicalBackground?: string;

  @IsOptional()
  @IsString()
  photoDataUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  ownerId?: number;
}
