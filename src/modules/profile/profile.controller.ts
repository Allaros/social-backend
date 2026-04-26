import {
  Body,
  Controller,
  forwardRef,
  Get,
  Inject,
  InternalServerErrorException,
  Param,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { CurrentUser } from '@app/shared/decorators/currentUser.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateProfileDto } from './types/profile.dto';
import { DiskMulterFile } from '../file/types/file.interface';
import { UserEntity } from '../user/user.entity';
import { ReplaceAvatarUseCase } from '../file/use-cases/replace-avatar.usecase';

@Controller('profile')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    @Inject(forwardRef(() => ReplaceAvatarUseCase))
    private readonly replaceAvatarUseCase: ReplaceAvatarUseCase,
  ) {}

  @Get(':username')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async getProfileByUsername(
    @Param('username') username: string,
    @CurrentUser('id') userId: number,
  ) {
    const { profile, isOwner } =
      await this.profileService.findProfileByUsername(username, userId);

    return this.profileService.buildProfileResponse(profile, isOwner);
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
    let avatarUrl: string | null = null;
    try {
      if (image) {
        avatarUrl = await this.replaceAvatarUseCase.execute(
          user.profile.id,
          image.buffer,
          user.profile.avatarUrl,
        );
      }
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('Ошибка при загрузке аватара');
    }

    const updateProfile = await this.profileService.updateProfile(
      user.id,
      body,
      avatarUrl,
    );

    return this.profileService.buildProfileResponse(updateProfile, true);
  }
}
