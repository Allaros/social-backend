import { Injectable } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailerService {
  constructor(private readonly mailerService: NestMailerService) {}

  async sendVerificationCode(email: string, code: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Код верификации',
      html: `<h1>Подтвердите email</h1>
             <p>Ваш код для подтверждения: <strong>${code}</strong></p>
             <p>Срок действия кода: 10 минут</p>`,
    });
  }

  async sendPasswordResetLink(email: string, link: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Сброс пароля',
      template: 'reset-password',
      context: { link },
    });
  }
}
