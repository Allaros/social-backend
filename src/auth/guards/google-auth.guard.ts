import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  handleRequest(err, user, info) {
    console.log('ERR:', err);
    console.log('INFO:', info);

    if (err) throw err;
    if (!user) throw new UnauthorizedException();

    return user;
  }
}
