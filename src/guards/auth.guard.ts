import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { verify } from 'jsonwebtoken';

import { UserRequest } from '@app/types/userRequest.interface';
import { UserService } from '@app/user/user.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<UserRequest>();
    const token = req.cookies['accessToken'] as string | undefined;

    if (!token) {
      throw new UnauthorizedException('Access token not found');
    }

    try {
      const payload = verify(token, process.env.JWT_SECRET!) as { sub: string };

      const user = await this.userService.findById(Number(payload.sub));
      if (!user) throw new UnauthorizedException('Пользователь не найден');
      req.user = user;
      return true;
    } catch (err) {
      console.log(err);
      throw new UnauthorizedException('Access token is invalid or expired');
    }
  }
}
