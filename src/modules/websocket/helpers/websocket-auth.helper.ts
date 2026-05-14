import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtPayload, verify } from 'jsonwebtoken';
import { AppSocket } from '../types/ws.types';
import { UserService } from '@app/modules/user/user.service';
import { parse } from 'cookie';

export async function authenticateSocket({
  client,
  configService,
  userService,
}: {
  client: AppSocket;
  configService: ConfigService;
  userService: UserService;
}) {
  const cookieHeader = client.handshake.headers.cookie;

  if (!cookieHeader) {
    throw new UnauthorizedException('Token missing');
  }

  const cookies = parse(cookieHeader);

  const token = cookies.accessToken;

  if (!token) {
    throw new UnauthorizedException('Token missing');
  }

  const secret = configService.get<string>('JWT_SECRET');

  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }

  let payload: JwtPayload;

  try {
    payload = verify(token, secret) as JwtPayload;
  } catch {
    throw new UnauthorizedException('Invalid token');
  }

  const userId = Number(payload.sub);

  if (!Number.isInteger(userId)) {
    throw new UnauthorizedException('Invalid token');
  }

  const user = await userService.findById(userId);

  if (!user) {
    throw new UnauthorizedException('User not found');
  }

  client.data.user = user;

  return user;
}
