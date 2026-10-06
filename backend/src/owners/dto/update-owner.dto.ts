import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateOwnerDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  documentNumber?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  phone?: string;

  @IsOptional()
  @Transform(({ value }: { value: string }) => value.trim().toLowerCase())
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  address?: string;
}
