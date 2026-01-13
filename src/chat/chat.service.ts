import { Injectable, Logger, Inject } from '@nestjs/common';
import { Server } from 'socket.io';
import {
  SuccessMessage,
  ErrorMessage,
  UserMessageDto,
} from './types/chat.types';
import { GoogleGenAI } from '@google/genai';
import { env } from 'src/config/env.schema';
import { GOOGLE_AI_CLIENT } from '../ai/ai.module';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(@Inject(GOOGLE_AI_CLIENT) private readonly ai: GoogleGenAI) {}

  async streamAiResponse(
    server: Server,
    sessionId: string,
    userMessageDto: UserMessageDto,
    controller: AbortController,
  ): Promise<void> {
    let successMessage: SuccessMessage;
    let errorMessage: ErrorMessage;

    try {
      const stream = await this.ai.models.generateContentStream({
        model: env.GOOGLE_AI_MODEL,
        contents: userMessageDto.message,
        config: { abortSignal: controller.signal },
      });

      // Inizio Stream
      process.stdout.write(`\n🤖 AI Response for ${sessionId}: \n`);

      for await (const chunk of stream) {
        const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;

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
      // Abort = non è un errore applicativo
      if ((err as Error).name === 'AbortError') {
        this.logger.debug(`Stream aborted for ${sessionId}`);
        return;
      }

      this.logger.error(err);

      // Errore formale
      errorMessage = {
        role: 'model',
        content: '',
        error: 'Errore durante la generazione della risposta',
        done: true,
      };
      server.to(sessionId).emit('receiveMessage', errorMessage);
    }
  }
}
