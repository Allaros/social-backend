import { Injectable } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';
import { MailType } from './types/mailer.types';

@Injectable()
export class MailerService {
  constructor(private readonly mailerService: NestMailerService) {}

  async sendMail(
    email: string,
    type: MailType,
    context: Record<string, unknown>,
  ) {
    const subjects: Record<MailType, string> = {
      [MailType.VERIFY_EMAIL]: 'Код подтверждения',
      [MailType.PASSWORD_RESET]: 'Сброс пароля',
      [MailType.MAGIC_LINK]: 'Вход в аккаунт',
    };

    await this.mailerService.sendMail({
      to: email,
      subject: subjects[type],
      template: type,
      context,
    });
  }
}
