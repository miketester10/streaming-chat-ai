import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/loginResponse.dto';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  login(loginDto: LoginDto): LoginResponseDto {
    // In a real app, we would use a real bcrypt check and store data in a database.
    // For this demo, let's just use a simple check since I don't have the real hash for 'password' handy
    // and I'll use a fixed secret for JWT.
    if (
      loginDto.email === 'admin@admin.com' &&
      loginDto.password === '123456'
    ) {
      const payload = { sub: loginDto.email };
      return {
        access_token: this.jwtService.sign(payload),
      };
    }
    throw new BadRequestException('Invalid credentials.');
  }
}
