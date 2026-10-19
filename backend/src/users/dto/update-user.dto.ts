import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { RoleKey, UserStatus } from '../../generated/prisma/client';

export class UpdateUserDto {
  @IsOptional() @IsString() @MinLength(1) name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @MinLength(12) password?: string;
  @IsOptional() @IsEnum(RoleKey) role?: Exclude<RoleKey, typeof RoleKey.OWNER>;
  @IsOptional() @IsEnum(UserStatus) status?: UserStatus;
}
