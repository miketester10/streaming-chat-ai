import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

@Module({
  imports: [],
  controllers: [],
  providers: [ChatService, ChatGateway],
  exports: [],
})
export class ChatModule {}
