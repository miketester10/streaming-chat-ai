import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { JwtPayload } from '@/auth/interface/jwt-payload.interface';
import { AuthenticatedSocket } from '@/chat/types/authenticated-socket';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client = context.switchToWs().getClient<AuthenticatedSocket>();

      const authToken = (client.handshake.auth.token ||
        client.handshake.headers.authorization?.split(' ')[1]) as
        | string
        | undefined;

      if (!authToken) {
        this.logger.error('No token found in handshake');
        throw new WsException('Missing token.');
      }

      const jwtPayload = await this.jwtService.verifyAsync<JwtPayload>(
        authToken,
        {
          secret: 'secretKey',
        },
      );

      // Collega il jwtPayload al client nella proprietà user per usi successivi
      client.data.user = jwtPayload;

      return true;
    } catch (err) {
      this.logger.error(`${(err as Error).message}`);
      throw new WsException('Unauthorized. Missing or invalid token.');
    }
  }
}
