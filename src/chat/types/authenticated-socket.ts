import { Socket } from 'socket.io';
import { JwtPayload } from 'src/auth/interface/jwt-payload.interface';

export interface AuthenticatedSocket extends Socket {
  data: {
    user: JwtPayload;
  };
}
