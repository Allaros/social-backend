import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthRequest } from '@app/common/types/request.interface';

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthRequest>();

    const user = req.user;

    if (!user?.isVerified) {
      throw new ForbiddenException('Email not verified');
    }

    return true;
  }
}
