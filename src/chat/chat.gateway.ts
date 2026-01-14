import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { ChatRequestSchema } from './types/chat-request.schema';
import z from 'zod';

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private readonly server: Server;
  private readonly logger = new Logger(ChatGateway.name);
  private readonly sessions = new Map<string, AbortController>(); // sessionId -> AbortController

  constructor(private readonly chatService: ChatService) {}

  async handleConnection(client: Socket): Promise<void> {
    const sessionId = client.id;
    await client.join(sessionId);
    this.logger.debug(`Client connected: ${sessionId}`);
  }

  handleDisconnect(client: Socket): void {
    const sessionId = client.id;

    // Interrompi eventuale stream AI
    this.sessions.get(sessionId)?.abort();
    this.sessions.delete(sessionId);

    this.logger.debug(`Client disconnected: ${sessionId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: unknown,
  ): Promise<void> {
    const sessionId = client.id;

    // Blocca se c'è uno stream in corso
    if (this.sessions.has(sessionId)) {
      this.logger.warn(`Stream already running for ${sessionId}`);
      return;
    }

    // Parsing payload
    try {
      payload = typeof payload === 'string' ? JSON.parse(payload) : payload;
    } catch (err) {
      this.logger.error(`Invalid JSON payload: ${(err as Error).message}`);
      return;
    }

    // Validazione con Zod
    const parsed = ChatRequestSchema.safeParse(payload);

    if (!parsed.success) {
      this.logger.error(
        `Invalid payload: ${JSON.stringify(z.treeifyError(parsed.error).properties, null, 2)}`,
      );
      return;
    }

    const abortController = new AbortController();
    this.sessions.set(sessionId, abortController);

    // Avvia streaming AI
    await this.chatService.streamAiResponse(
      this.server,
      sessionId,
      parsed.data,
      abortController,
    );

    // Pulizia sessions dopo completamento sia in caso di successo che di errore
    this.sessions.delete(sessionId);
  }
}
