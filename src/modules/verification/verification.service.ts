import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { VerificationEntity } from './verification.entity';
import { MailerService } from '../mailer/mailer.service';
import { UserEntity } from '../user/user.entity';
import { VerificationType } from './types/verification.interface';
import { createHash, randomBytes, randomInt } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { MailType } from '../mailer/types/mailer.types';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(VerificationEntity)
    private readonly verificationRepository: Repository<VerificationEntity>,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  private readonly VERIFICATION_COOLDOWN = 60 * 1000;

  private generateCode(): string {
    return randomInt(0, 10000).toString().padStart(4, '0');
  }

  private generateVerificationToken() {
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');

    return { token, tokenHash };
  }

  async createNewVerification(
    type: VerificationType,
    user?: UserEntity,
    email?: string,
  ): Promise<string> {
    const targetEmail = user?.email ?? email;

    if (!targetEmail)
      throw new ForbiddenException('Email обязателен для верификации');

    const lastVerification = await this.verificationRepository.findOne({
      where: user
        ? { user: { id: user.id }, type, usedAt: IsNull() }
        : { email: targetEmail, type, usedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });

    if (
      lastVerification &&
      Date.now() - lastVerification.createdAt.getTime() <
        this.VERIFICATION_COOLDOWN
    ) {
      throw new HttpException(
        'Письмо уже отправлено. Попробуйте через несколько секунд.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    let code: string | null = null;
    let codeHash: string | null = null;

    if (type === VerificationType.EMAIL) {
      code = this.generateCode();
      codeHash = createHash('sha256').update(code).digest('hex');
    }

    const { token, tokenHash } = this.generateVerificationToken();

    await this.dataSource.transaction(async (manager) => {
      if (user) {
        await manager.update(
          VerificationEntity,
          { user: { id: user.id }, type, usedAt: IsNull() },
          { usedAt: new Date() },
        );
      } else {
        await manager.update(
          VerificationEntity,
          { email: targetEmail, type, usedAt: IsNull() },
          { usedAt: new Date() },
        );
      }

      const verification = manager.create(VerificationEntity, {
        codeHash,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 60 * 1000),
        type,
        email: targetEmail,
        ...(user && { user }),
      });

      await manager.save(verification);
    });

    const baseUrl = this.configService.get<string>('FRONTEND_URL');

    switch (type) {
      case VerificationType.EMAIL: {
        if (!code) throw new Error('Verification code not generated');
        await this.mailerService.sendMail(targetEmail, MailType.VERIFY_EMAIL, {
          code,
        });
        break;
      }
      case VerificationType.MAGIC_LINK: {
        const link = `${baseUrl}/magic?token=${token}`;
        await this.mailerService.sendMail(targetEmail, MailType.MAGIC_LINK, {
          link,
        });
        break;
      }
      case VerificationType.PASSWORD_RESET: {
        const link = `${baseUrl}/reset-password?recovery=${token}`;
        await this.mailerService.sendMail(
          targetEmail,
          MailType.PASSWORD_RESET,
          {
            link,
          },
        );
        break;
      }
    }

    return token;
  }

  async verifyVerification(
    token: string,
    type: VerificationType,
    code?: string,
    consume: boolean = true,
  ): Promise<VerificationEntity> {
    const currentToken = createHash('sha256').update(token).digest('hex');

    const verification = await this.verificationRepository.findOne({
      where: { tokenHash: currentToken, type },
      relations: ['user'],
    });

    if (!verification) {
      throw new ForbiddenException(
        'Ссылка недействительна или срок ее действия истек',
      );
    }

    if (verification.attempts >= 5) {
      throw new ForbiddenException('Слишком много попыток');
    }

    if (verification.expiresAt < new Date() || verification.usedAt) {
      await this.verificationRepository.increment(
        { id: verification.id },
        'attempts',
        1,
      );

      throw new ForbiddenException(
        'Ссылка недействительна или срок ее действия истек',
      );
    }

    if (type === VerificationType.EMAIL) {
      if (!code) {
        throw new ForbiddenException('Код подтверждения обязателен');
      }

      if (!verification.codeHash) {
        throw new ForbiddenException('Код подтверждения отсутствует');
      }

      const currentCode = createHash('sha256').update(code).digest('hex');

      if (currentCode !== verification.codeHash) {
        await this.verificationRepository.increment(
          { id: verification.id },
          'attempts',
          1,
        );

        throw new ForbiddenException(
          'Код недействителен или срок его действия истек',
        );
      }
    }

    if (consume) {
      await this.verificationRepository.update(verification.id, {
        usedAt: new Date(),
      });
    }

    return verification;
  }
}
