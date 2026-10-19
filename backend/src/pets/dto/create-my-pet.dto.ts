import { IsBoolean, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { PetSex, PetSpecies } from '../../generated/prisma/client';

export class CreateMyPetDto {
  @IsString() @MinLength(1) name!: string;
  @IsEnum(PetSpecies) species!: PetSpecies;
  @IsString() @MinLength(1) breed!: string;
  @IsEnum(PetSex) sex!: PetSex;
  @IsString() @MinLength(1) age!: string;
  @IsString() @MinLength(1) color!: string;
  @IsString() @MinLength(1) weight!: string;
  @IsBoolean() isNeutered!: boolean;
  @IsString() medicalBackground!: string;
  @IsOptional() @IsString() photoDataUrl?: string;
}
