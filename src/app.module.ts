import { Module } from '@nestjs/common';
import { ChatModule } from './chat/chat.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [ChatModule, AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
