import { VerificationEntity } from '@app/verification/verification.entity';
import { UserEntity } from '@app/user/user.entity';
import { MailerService } from '@app/mailer/mailer.service';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, randomInt } from 'crypto';
import { Repository } from 'typeorm';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(VerificationEntity)
    private readonly verificationRepository: Repository<VerificationEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly mailerService: MailerService,
  ) {}

  private generateVerificationCode() {
    const code = randomInt(0, 10000);
    return code.toString().padStart(4, '0');
  }

  generateToken(length: number) {
    return randomBytes(length).toString('hex');
  }

  async findByRecoveryToken(
    recoveryToken: string,
  ): Promise<VerificationEntity | null> {
    const verification = await this.verificationRepository.findOne({
      where: { recoveryToken: recoveryToken },
      relations: ['user'],
    });

    return verification;
  }

  async createEmailVerification(
    user: UserEntity,
  ): Promise<{ tempToken: string; recoveryToken: string }> {
    const code = this.generateVerificationCode();
    const tempToken = this.generateToken(16);
    const recoveryToken = this.generateToken(32);
    const recoveryExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const tempExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const verification = this.verificationRepository.create({
      code,
      tempToken,
      recoveryToken,
      recoveryExpiresAt,
      expiresAt: tempExpiresAt,
      user,
    });

    await this.verificationRepository.save(verification);

    await this.mailerService.sendVerificationCode(user.email, code);

    return { tempToken, recoveryToken };
  }

  async verifyCode(code: string, token?: string) {
    if (!token) throw new ForbiddenException('Нет доступа');

    const verification = await this.verificationRepository.findOne({
      where: { tempToken: token, code },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    if (!verification || verification.expiresAt < new Date())
      throw new ForbiddenException('Неверный или истекший код');

    const user = verification.user;

    user.isVerified = true;
    await this.userRepository.save(user);
    await this.verificationRepository.remove(verification);
    return user;
  }

  async resendVerificationCode(user: UserEntity, recoveryToken: string) {
    const verification = await this.verificationRepository.findOne({
      where: { recoveryToken, user: { id: user.id } },
      order: { createdAt: 'DESC' },
    });

    if (
      !verification ||
      !verification.recoveryExpiresAt ||
      verification.recoveryExpiresAt < new Date()
    ) {
      throw new ForbiddenException('Нельзя отправить новый код');
    }

    const newTempToken = this.generateToken(16);
    const newCode = this.generateVerificationCode();
    verification.tempToken = newTempToken;
    verification.code = newCode;
    verification.expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.verificationRepository.save(verification);
    await this.mailerService.sendVerificationCode(user.email, newCode);

    return newTempToken;
  }
}
