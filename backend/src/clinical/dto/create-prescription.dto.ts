import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { AttentionPrescriptionItemDto } from './register-attention.dto';

export class CreatePrescriptionDto {
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
  consultationId?: number;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AttentionPrescriptionItemDto)
  items!: AttentionPrescriptionItemDto[];
}
