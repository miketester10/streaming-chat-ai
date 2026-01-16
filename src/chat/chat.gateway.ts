import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Namespace, Socket } from 'socket.io';
import { ChatService } from '@/chat/chat.service';
import { ChatRequestSchema } from '@/chat/types/chat-request.schema';
import { WsJwtGuard } from '@/chat/guard/ws-jwt.guard';
import { AuthenticatedSocket } from '@/chat/interface/authenticated-socket.interface';
import z from 'zod';

@WebSocketGateway({ cors: true, namespace: 'chat-ai' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private readonly server: Namespace;
  private readonly logger = new Logger(ChatGateway.name);
  private readonly sessions = new Map<string, AbortController>(); // sessionId -> AbortController

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket): void {
    const sessionId = client.id;
    const sockets = this.server.sockets;
    this.logger.debug(
      `Client connected: ${sessionId}, Total clients: ${sockets.size}`,
    );
  }

  handleDisconnect(client: Socket): void {
    const sessionId = client.id;

    // Interrompi eventuale stream AI
    this.sessions.get(sessionId)?.abort();
    this.sessions.delete(sessionId);

    const sockets = this.server.sockets;
    this.logger.debug(
      `Client disconnected: ${sessionId}, Total clients: ${sockets.size}`,
    );
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: unknown,
  ): Promise<void> {
    const sessionId = client.id;

    // Accediamo al payload del jwt token, se ha passato la verifica nel WsJwtGuard
    const jwtPayload = client.data.user;
    this.logger.debug(jwtPayload);

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
