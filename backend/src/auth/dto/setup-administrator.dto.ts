import { IsEmail, IsString, MinLength } from 'class-validator';

export class SetupAdministratorDto {
  @IsString() @MinLength(1) name!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(12) password!: string;
}
