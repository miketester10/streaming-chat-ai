import { Injectable, Logger, Inject } from '@nestjs/common';
import { Server } from 'socket.io';
import { GoogleGenAI } from '@google/genai';
import { env } from 'src/config/env.schema';
import { GOOGLE_AI_CLIENT } from '../ai/ai.module';
import { ChatRequestDto } from './types/chat-request.schema';
import { ErrorMessage, SuccessMessage } from './types/chat-response.schema';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(@Inject(GOOGLE_AI_CLIENT) private readonly ai: GoogleGenAI) {}

  async streamAiResponse(
    server: Server,
    sessionId: string,
    chatRequestDto: ChatRequestDto,
    abortController: AbortController,
  ): Promise<void> {
    let successMessage: SuccessMessage;
    let errorMessage: ErrorMessage;

    try {
      const streamChat = this.ai.chats.create({
        model: env.GOOGLE_AI_MODEL,
        history: chatRequestDto.history,
        config: {
          systemInstruction:
            'You are a helpful assistant. Reply always in markdown format (text/markdown).',
          abortSignal: abortController.signal,
        },
      });

      const response = await streamChat.sendMessageStream({
        message: chatRequestDto.newMessage,
      });

      // Inizio Stream
      process.stdout.write(`\n🤖 AI Response for ${sessionId}: \n`);

      for await (const chunk of response) {
        const text = chunk.text;

        if (!text) continue;

        // Effetto "typing" in console
        process.stdout.write(text);

        successMessage = {
          role: 'model',
          content: text,
          done: false,
        };
        server.to(sessionId).emit('receiveMessage', successMessage);
      }

      process.stdout.write('\n'); // Fine linea dopo lo stream

      // Fine Stream
      successMessage = {
        role: 'model',
        content: '',
        done: true,
      };
      server.to(sessionId).emit('receiveMessage', successMessage);
    } catch (err) {
      // AbortError = non è un errore applicativo
      if ((err as Error).name === 'AbortError') {
        this.logger.debug(`Stream aborted for ${sessionId}`);
        return;
      }

      this.logger.error(err);

      // Errore formale
      errorMessage = {
        role: 'system',
        content: '',
        error: 'Errore durante la generazione della risposta',
        done: true,
      };
      server.to(sessionId).emit('receiveMessage', errorMessage);
    }
  }
}
