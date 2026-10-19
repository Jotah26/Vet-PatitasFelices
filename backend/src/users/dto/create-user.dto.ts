import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { RoleKey } from '../../generated/prisma/client';

export class CreateUserDto {
  @IsString() @MinLength(1) name!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(12) password!: string;
  @IsEnum(RoleKey) role!: Exclude<RoleKey, typeof RoleKey.OWNER>;
}
