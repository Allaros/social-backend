import { UserEntity } from '@app/user/user.entity';
import { Request } from 'express';

export interface UserRequest extends Request {
  user?: UserEntity | null;
}
