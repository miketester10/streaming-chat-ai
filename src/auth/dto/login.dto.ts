import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6)
  @Transform(({ value }) => typeof value === 'string' && value.trim())
  password: string;
}
