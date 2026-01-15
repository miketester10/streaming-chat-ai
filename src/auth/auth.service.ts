import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/loginResponse.dto';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  login(loginDto: LoginDto): LoginResponseDto {
    // In un'app reale, useremmo un controllo bcrypt reale e memorizzeremmo i dati in un database.
    // Per questa demo, usiamo un semplice controllo poiché non ho l'hash reale per 'password'
    // e userò un segreto fisso per il JWT.
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
