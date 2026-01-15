import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from '@/auth/auth.service';
import { AuthController } from '@/auth/auth.controller';

@Module({
  imports: [
    JwtModule.register({
      secret: 'secretKey',
      global: true,
      signOptions: { expiresIn: '60m' },
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [],
})
export class AuthModule {}
