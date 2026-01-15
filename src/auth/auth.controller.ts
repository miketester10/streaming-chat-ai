import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from '@/auth/auth.service';
import { LoginDto } from '@/auth/dto/login.dto';
import { LoginResponseDto } from '@/auth/dto/loginResponse.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('login')
  login(@Body() loginDto: LoginDto): LoginResponseDto {
    return this.authService.login(loginDto);
  }
}
