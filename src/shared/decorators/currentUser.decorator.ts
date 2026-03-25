import { AuthRequest } from '@app/shared/types/request.interface';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: keyof AuthRequest['user'], ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<AuthRequest>();

    const user = req.user;

    return data ? user?.[data] : user;
  },
);
