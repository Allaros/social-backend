import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { CurrentUser } from '@app/common/decorators/currentUser.decorator';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

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
}
