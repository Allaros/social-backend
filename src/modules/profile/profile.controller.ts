import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { CurrentUser } from '@app/shared/decorators/currentUser.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateProfileDto } from './types/profile.dto';
import { DiskMulterFile } from '../file/types/file.interface';
import { UserEntity } from '../user/user.entity';
import { GetProfileByUsernameUseCase } from './use-cases/get-profile-by-username.usecase';
import { UpdateProfileUseCase } from './use-cases/update-profile.usecase';

@Controller('profile')
export class ProfileController {
  constructor(
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly getProfileByUsernameUseCase: GetProfileByUsernameUseCase,
  ) {}

  @Get(':username')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async getProfileByUsername(
    @Param('username') username: string,
    @CurrentUser() user: UserEntity,
  ) {
    return await this.getProfileByUsernameUseCase.execute(
      username,
      user.profile.id,
    );
  }

  @Put('update')
  @UseInterceptors(FileInterceptor('image'))
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  @UsePipes(new ValidationPipe())
  async updateProfile(
    @Body() body: UpdateProfileDto,
    @CurrentUser() user: UserEntity,
    @UploadedFile() image?: DiskMulterFile,
  ) {
    return await this.updateProfileUseCase.execute({
      body,
      image,
      profileId: user.profile.id,
    });
  }
}
