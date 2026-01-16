import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Namespace, Socket } from 'socket.io';
import { ChatService } from '@/chat/chat.service';
import { WsJwtGuard } from '@/chat/guard/ws-jwt.guard';
import { AuthenticatedSocket } from '@/chat/interface/authenticated-socket.interface';
import { validate } from '@/chat/util/validate.util';
import { ChatRequestDto } from '@/chat/types/chat-request.schema';

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
    let chatRequestDto: ChatRequestDto;

    // Accediamo al payload del jwt token, se ha passato la verifica nel WsJwtGuard (attualmente viene solo stampato nella console)
    const jwtPayload = client.data.user;
    this.logger.debug(jwtPayload);

    // Blocca se c'è uno stream in corso
    if (this.sessions.has(sessionId)) {
      this.logger.warn(`Stream already running for ${sessionId}`);
      return;
    }

    // Validate payload
    try {
      chatRequestDto = validate(payload);
    } catch (err) {
      this.logger.error(`Error validating payload: ${(err as Error).message}`);
      throw new WsException(
        `Error validating payload: ${(err as Error).message}`,
      );
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
