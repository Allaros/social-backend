import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import { UserEntity } from '@app/modules/user/user.entity';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = UserEntity>(
    err: unknown,
    user: UserEntity | false,
    info: unknown,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: ExecutionContext,
  ): TUser {
    if (info instanceof TokenExpiredError) {
      throw new UnauthorizedException({
        message: 'Access token expired',
        code: 'TOKEN_EXPIRED',
      });
    }

    if (info instanceof JsonWebTokenError) {
      throw new UnauthorizedException({
        message: 'Invalid token',
        code: 'INVALID_TOKEN',
      });
    }

    if (err instanceof Error) {
      throw err;
    }

    if (!user) {
      throw new UnauthorizedException({
        code: 'ACCESS_TOKEN_MISSING',
        message: 'Access token not found',
      });
    }

    return user as TUser;
  }
}
