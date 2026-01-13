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
import { UserMessageSchema } from './types/chat.schema';
import z from 'zod';

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private readonly server: Server;
  private readonly logger = new Logger(ChatGateway.name);
  private readonly sessions = new Map<string, AbortController>(); // sessionId -> AbortController

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket): void {
    const sessionId = client.id;
    client.join(sessionId);
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

    // Blocca se già in streaming
    if (this.sessions.has(sessionId)) {
      this.logger.warn(`Stream already running for ${sessionId}`);
      return;
    }

    // Validazione con Zod
    const parsed = UserMessageSchema.safeParse(
      typeof payload === 'string' ? JSON.parse(payload) : payload,
    );

    if (!parsed.success) {
      this.logger.error(
        'Invalid payload',
        z.treeifyError(parsed.error).properties,
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

    // Pulizia dopo completamento
    this.sessions.delete(sessionId);
  }
}
