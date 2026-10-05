import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { PetSex, PetSpecies } from '../../generated/prisma/client';

export class CreatePetDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsEnum(PetSpecies)
  species!: PetSpecies;

  @IsString()
  @MinLength(1)
  breed!: string;

  @IsEnum(PetSex)
  sex!: PetSex;

  @IsString()
  @MinLength(1)
  age!: string;

  @IsString()
  @MinLength(1)
  color!: string;

  @IsString()
  @MinLength(1)
  weight!: string;

  @IsBoolean()
  isNeutered!: boolean;

  @IsString()
  medicalBackground!: string;

  @IsOptional()
  @IsString()
  photoDataUrl?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  ownerId!: number;
}
