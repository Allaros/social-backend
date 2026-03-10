import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../src/modules/auth/auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SessionEntity } from '../src/modules/auth/session.entity';
import { Repository, DataSource } from 'typeorm';
import { UserService } from '../src/modules/user/user.service';
import { ProfileService } from '../src/modules/profile/profile.service';
import { VerificationService } from '../src/modules/verification/verification.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

describe('AuthService', () => {
  let service: AuthService;

  let sessionRepository: jest.Mocked<Repository<SessionEntity>>;
  let userService: jest.Mocked<UserService>;
  let verificationService: jest.Mocked<VerificationService>;

  const mockRequest: any = {
    get: jest.fn().mockReturnValue('jest-agent'),
    headers: {},
    socket: { remoteAddress: '127.0.0.1' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(SessionEntity),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              delete: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              setParameters: jest.fn().mockReturnThis(),
              execute: jest.fn(),
            })),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            findByEmail: jest.fn(),
            updatePassword: jest.fn(),
          },
        },
        {
          provide: ProfileService,
          useValue: {},
        },
        {
          provide: VerificationService,
          useValue: {
            verifyVerification: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_SECRET') return 'testsecret';
              if (key === 'MAX_SESSIONS') return 5;
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    sessionRepository = module.get(getRepositoryToken(SessionEntity));
    userService = module.get(UserService);
    verificationService = module.get(VerificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Register', () => {
    it('should register user successfully', async () => {
      const user: any = {
        id: 1,
        email: 'test@test.com',
        passwordHash: 'hash',
      };

      userService.findByEmail.mockResolvedValue(null);

      jest
        .spyOn<any, any>(service as any, 'registerWithProvider')
        .mockResolvedValue({
          user,
          accessToken: 'a',
          refreshToken: 'r',
        });

      const result = await service.registerWithPassword(
        {
          email: 'test@test.com',
          password: '123456',
        },
        mockRequest,
      );

      expect(result.accessToken).toBe('a');
      expect(result.refreshToken).toBe('r');
    });

    it('should throw if email already exists', async () => {
      userService.findByEmail.mockResolvedValue({
        id: 1,
      } as any);

      jest
        .spyOn<any, any>(service as any, 'registerWithProvider')
        .mockRejectedValue(new ConflictException());

      await expect(
        service.registerWithPassword(
          {
            email: 'test@test.com',
            password: '123456',
          },
          mockRequest,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Login', () => {
    it('should login successfully', async () => {
      const user: any = {
        id: 1,
        email: 'test@test.com',
        passwordHash: 'hash',
      };

      userService.findByEmail.mockResolvedValue(user);

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      jest.spyOn<any, any>(service as any, 'issueTokens').mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
      });

      const result = await service.authorizeUser(
        {
          email: 'test@test.com',
          password: '123',
        },
        mockRequest,
      );

      expect(result.accessToken).toBe('access');
      expect(result.refreshToken).toBe('refresh');
    });

    it('should throw if user not found', async () => {
      userService.findByEmail.mockResolvedValue(null);

      await expect(
        service.authorizeUser(
          {
            email: 'missing@test.com',
            password: '123',
          },
          mockRequest,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if password invalid', async () => {
      const user: any = {
        id: 1,
        passwordHash: 'hash',
      };

      userService.findByEmail.mockResolvedValue(user);

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        service.authorizeUser(
          {
            email: 'test@test.com',
            password: 'wrong',
          },
          mockRequest,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Refresh token', () => {
    it('should refresh tokens successfully', async () => {
      const tokenSecret = 'secret';
      const sessionId = 1;

      const hash = crypto
        .createHash('sha256')
        .update(tokenSecret)
        .digest('hex');

      const session: any = {
        id: sessionId,
        refreshTokenHash: hash,
        device: 'desktop',
        platform: 'unknown',
        expiresAt: new Date(Date.now() + 100000),
        user: { id: 1 },
      };

      sessionRepository.findOne.mockResolvedValue(session);

      sessionRepository.update.mockResolvedValue({} as any);

      jest.spyOn(service, 'generateRefreshToken').mockReturnValue({
        token: 'newtoken',
        hashedToken: 'hash',
      });

      const result = await service.refresh(
        `${sessionId}.${tokenSecret}`,
        mockRequest,
      );

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toContain(`${sessionId}.`);
    });

    it('should throw if session not found', async () => {
      sessionRepository.findOne.mockResolvedValue(null);

      await expect(service.refresh('1.invalid', mockRequest)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw if session expired', async () => {
      const session: any = {
        id: 1,
        refreshTokenHash: 'hash',
        device: 'jest-agent',
        platform: 'unknown',
        expiresAt: new Date(Date.now() - 1000),
        user: { id: 1 },
      };

      sessionRepository.findOne.mockResolvedValue(session);

      await expect(service.refresh('1.secret', mockRequest)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('Logout', () => {
    it('should delete session', async () => {
      sessionRepository.delete.mockResolvedValue({} as any);

      await service.logout('1.token');

      expect(sessionRepository.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('Logout all', () => {
    it('should delete all sessions', async () => {
      sessionRepository.delete.mockResolvedValue({} as any);

      await service.logoutAll(1);

      expect(sessionRepository.delete).toHaveBeenCalledWith({
        user: { id: 1 },
      });
    });
  });

  describe('Change password', () => {
    it('should change password successfully', async () => {
      verificationService.verifyVerification.mockResolvedValue({
        user: { id: 1 },
      } as any);

      await service.changeUserPassword({
        token: 'token',
        password: 'newpass',
      });

      expect(userService.updatePassword).toHaveBeenCalled();
      expect(sessionRepository.delete).toHaveBeenCalledWith({
        user: { id: 1 },
      });
    });

    it('should throw if verification invalid', async () => {
      verificationService.verifyVerification.mockRejectedValue(
        new UnauthorizedException(),
      );

      await expect(
        service.changeUserPassword({
          token: 'bad',
          password: 'pass',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Magic link', () => {
    it('should login with magic link', async () => {
      verificationService.verifyVerification.mockResolvedValue({
        email: 'magic@test.com',
      } as any);

      jest
        .spyOn<any, any>(service as any, 'registerWithProvider')
        .mockResolvedValue({
          accessToken: 'a',
          refreshToken: 'r',
          user: {},
        });

      const result = await service.loginWithMagicLink('token', mockRequest);

      expect(result.accessToken).toBe('a');
    });

    it('should throw if magic link invalid', async () => {
      verificationService.verifyVerification.mockRejectedValue(
        new UnauthorizedException(),
      );

      await expect(
        service.loginWithMagicLink('bad', mockRequest),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
