import {
  Body,
  Controller,
  Post,
  Put,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ChangePasswordDto,
  SendRecoveryMailDto,
} from './types/recoveryPassword.dto';
import { PasswordRecoveryService } from './passwordRecovery.service';

@Controller('password-recovery')
export class PasswordRecoveryController {
  constructor(
    private readonly passwordRecoveryService: PasswordRecoveryService,
  ) {}
  @Post()
  @UsePipes(new ValidationPipe())
  async sendRecoveryMail(@Body() sendRecoveryMailDto: SendRecoveryMailDto) {
    await this.passwordRecoveryService.sendRecoveryMail(
      sendRecoveryMailDto.email,
    );

    return { success: true };
  }

  @Put('new-password')
  @UsePipes(new ValidationPipe())
  async createNewPassword(@Body() changePasswordDto: ChangePasswordDto) {
    await this.passwordRecoveryService.verifyAndChangePassword(
      changePasswordDto.token,
      changePasswordDto.password,
    );

    return { success: true };
  }
}
