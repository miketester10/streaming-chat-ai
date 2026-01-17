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
import { WsJwtGuard } from '@/chat/guard/ws-jwt.guard';
import { AuthenticatedSocket } from '@/chat/interface/authenticated-socket.interface';
import {
  ChatRequestDto,
  ChatRequestSchema,
} from '@/chat/types/chat-request.schema';
import { ZodValidationPipe } from '@/chat/pipe/zod-validation.pipe';

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
    @ConnectedSocket()
    client: AuthenticatedSocket,
    @MessageBody(new ZodValidationPipe(ChatRequestSchema))
    chatRequestDto: ChatRequestDto,
  ): Promise<void> {
    const sessionId = client.id;

    // Accediamo al payload del jwt token, se ha passato la verifica nel WsJwtGuard (attualmente viene solo stampato nella console)
    // In futuro si puo implementare un metodo per recuperare la history dello user direttamente dal database senza riceverla dal frontend.
    const jwtPayload = client.data.user;
    this.logger.debug(jwtPayload);

    // Blocca se c'è già uno stream in corso
    if (this.sessions.has(sessionId)) {
      this.logger.warn(`Stream already running for ${sessionId}`);
      return;
    }

    const abortController = new AbortController();
    this.sessions.set(sessionId, abortController);

    // Avvia streaming AI
    await this.chatService.streamAiResponse(
      this.server,
      sessionId,
      chatRequestDto,
      abortController,
    );

    // Pulizia sessions dopo completamento sia in caso di successo che di errore
    this.sessions.delete(sessionId);
  }
}
