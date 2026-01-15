import { Module } from '@nestjs/common';
import { ChatGateway } from '@/chat/chat.gateway';
import { ChatService } from '@/chat/chat.service';
import { AiModule } from '@/ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [],
  providers: [ChatService, ChatGateway],
  exports: [],
})
export class ChatModule {}
