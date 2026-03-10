import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthService } from '../src/modules/auth/auth.service';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../src/modules/user/user.service';
import { VerificationService } from '../src/modules/verification/verification.service';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    registerWithPassword: jest.fn(),
    authorizeUser: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    logoutAll: jest.fn(),
    changeUserPassword: jest.fn(),
  };

  const mockUserService = {
    buildUserResponse: jest.fn(),
    verifyUser: jest.fn(),
    findByEmail: jest.fn(),
    findBySession: jest.fn(),
  };

  const mockVerificationService = {
    createNewVerification: jest.fn(),
    verifyVerification: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('false'),
  };

  const mockResponse = () => {
    const res: any = {};
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    res.redirect = jest.fn().mockReturnValue(res);
    return res;
  };

  const mockRequest = (cookies = {}) => ({
    cookies,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: UserService, useValue: mockUserService },
        { provide: VerificationService, useValue: mockVerificationService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('signUp should register user and set cookies', async () => {
    const user = { id: 1 };
    const dto = { email: 'test@mail.com', password: '123456' };

    mockAuthService.registerWithPassword.mockResolvedValue({
      user,
      accessToken: 'access',
      refreshToken: 'refresh',
    });

    mockVerificationService.createNewVerification.mockResolvedValue(
      'verificationToken',
    );

    mockUserService.buildUserResponse.mockReturnValue({ user });

    const res = mockResponse();

    const result = await controller.signUp(dto as any, {} as any, res);

    expect(mockAuthService.registerWithPassword).toHaveBeenCalled();
    expect(res.cookie).toHaveBeenCalled();
    expect(result).toEqual({ user });
  });

  it('verifyUser should throw if no verification cookie', async () => {
    const req = mockRequest();
    const res = mockResponse();

    await expect(
      controller.verifyUser({ code: '1234' } as any, req as any, res),
    ).rejects.toThrow(ForbiddenException);
  });

  it('refreshTokens should throw if no refresh token', async () => {
    const req = mockRequest();
    const res = mockResponse();

    await expect(controller.refreshTokens(req as any, res)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('refreshTokens should set new cookies', async () => {
    const req = mockRequest({ refreshToken: 'oldToken' });
    const res = mockResponse();

    mockAuthService.refresh.mockResolvedValue({
      accessToken: 'newAccess',
      refreshToken: 'newRefresh',
    });

    const result = await controller.refreshTokens(req as any, res);

    expect(mockAuthService.refresh).toHaveBeenCalledWith('oldToken', req);
    expect(res.cookie).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ success: true });
  });

  it('logout should clear cookies', async () => {
    const req = mockRequest({ refreshToken: 'token' });
    const res = mockResponse();

    const result = await controller.logout(req as any, res);

    expect(mockAuthService.logout).toHaveBeenCalledWith('token');
    expect(res.clearCookie).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ success: true });
  });

  it('logoutAll should clear cookies', async () => {
    const req: any = {
      user: { id: 1 },
    };

    const res = mockResponse();

    const result = await controller.logoutAll(req, res);

    expect(mockAuthService.logoutAll).toHaveBeenCalledWith(1);
    expect(res.clearCookie).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ success: true });
  });

  it('changePassword should call service', async () => {
    const dto = { password: 'newPass' };

    await controller.changePassword(dto as any);

    expect(mockAuthService.changeUserPassword).toHaveBeenCalledWith(dto);
  });
});
