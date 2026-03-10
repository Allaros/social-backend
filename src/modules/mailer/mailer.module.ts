import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Module } from '@nestjs/common';
import { MailerService } from './mailer.service';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config();

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: process.env.GMAIL_HOST,
        port: 587,
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      },

      defaults: {
        from: '"MyApp" <no-reply@myapp.com>',
      },

      template: {
        dir: join(process.cwd(), 'src/modules/mailer/templates'),
        adapter: new HandlebarsAdapter(),
      },
    }),
  ],
  providers: [MailerService],
  exports: [MailerService],
})
export class CustomMailerModule {}
