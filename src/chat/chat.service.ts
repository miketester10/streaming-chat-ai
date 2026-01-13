import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import {
  SuccessMessage,
  ErrorMessage,
  UserMessageDto,
} from './types/chat.types';
import { GoogleGenAI } from '@google/genai';
import { env } from 'src/config/env.schema';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly ai = new GoogleGenAI({ apiKey: env.GOOGLE_AI_API_KEY });

  constructor() {}

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
      for await (const chunk of stream) {
        const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) continue;
        this.logger.debug(`Stream chunk for ${sessionId}: ${text}`);
        successMessage = {
          role: 'model',
          content: text,
          done: false,
        };
        server.to(sessionId).emit('receiveMessage', successMessage);
      }

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
