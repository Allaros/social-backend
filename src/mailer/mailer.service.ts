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
      html: `
        <h1>Сброс пароля</h1>
        <p>Чтобы сбросить пароль, перейдите по ссылке ниже:</p>
        <p><a href="${link}">${link}</a></p>
        <p>Ссылка действительна 5 минут.</p>
      `,
    });
  }
}
