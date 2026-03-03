import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PasswordRecoveryEntity } from './passwordRecovery.entity';
import { Repository } from 'typeorm';
import { UserService } from '@app/user/user.service';
import { createHash, randomBytes } from 'crypto';
import dotenv from 'dotenv';
import { MailerService } from '@app/mailer/mailer.service';

dotenv.config();

@Injectable()
export class PasswordRecoveryService {
  constructor(
    @InjectRepository(PasswordRecoveryEntity)
    private readonly passwordRepository: Repository<PasswordRecoveryEntity>,
    private readonly userServise: UserService,
    private readonly mailerService: MailerService,
  ) {}

  private generateRecoveryToken(): string {
    return randomBytes(64).toString('hex');
  }

  async sendRecoveryMail(email: string): Promise<void> {
    const user = await this.userServise.findByEmail(email);
    if (!user) throw new NotFoundException('Пользователь не найден');

    const recoveryToken = this.generateRecoveryToken();
    const hashedToken = createHash('sha256')
      .update(recoveryToken)
      .digest('hex');
    await this.passwordRepository.save({
      token: hashedToken,
      user: user,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });
    const frontendUrl = process.env.FRONTEND_URL!;
    const link = frontendUrl + '/reset-password' + `?recovery=${recoveryToken}`;
    await this.mailerService.sendPasswordResetLink(email, link);
  }

  async verifyAndChangePassword(
    currentToken: string,
    newPassword: string,
  ): Promise<void> {
    const hashedCurrentToken = createHash('sha256')
      .update(currentToken)
      .digest('hex');
    const token = await this.passwordRepository.findOne({
      where: { token: hashedCurrentToken },
      relations: ['user'],
    });

    if (!token || token.expiresAt < new Date())
      throw new ForbiddenException('Нет доступа');

    await this.userServise.changeUserPassword(token.user, newPassword);
    await this.passwordRepository.remove(token);
  }
}
