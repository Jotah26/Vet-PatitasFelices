import { Type } from 'class-transformer';
import { IsArray, IsDate, IsEnum, IsInt, IsOptional, IsString, Min, MinLength, ValidateNested } from 'class-validator';
import { ClinicalAttentionType } from '../../generated/prisma/client';

export class AttentionVaccineDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  batch?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  nextDueAt?: Date;
}

export class AttentionPrescriptionItemDto {
  @IsString()
  @MinLength(1)
  medication!: string;

  @IsString()
  @MinLength(1)
  dose!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  days!: number;
}

export class AttentionPrescriptionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttentionPrescriptionItemDto)
  items!: AttentionPrescriptionItemDto[];

  @IsOptional()
  @IsString()
  instructions?: string;
}

export class RegisterAttentionDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  petId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  veterinarianId!: number;

  @IsEnum(ClinicalAttentionType)
  type!: ClinicalAttentionType;

  @IsString()
  @MinLength(1)
  diagnosis!: string;

  @IsString()
  @MinLength(1)
  treatment!: string;

  @IsString()
  @MinLength(1)
  recommendations!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttentionVaccineDto)
  vaccines?: AttentionVaccineDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => AttentionPrescriptionDto)
  prescription?: AttentionPrescriptionDto;
}
