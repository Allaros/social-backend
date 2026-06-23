import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { MemberLeftChatUseCase } from '../use-cases/member-left-chat.usecase';
import { JwtAuthGuard } from '@app/modules/auth/guards/auth.guard';
import { EmailVerifiedGuard } from '@app/modules/auth/guards/email-verified.guard';
import { CurrentUser } from '@app/shared/decorators/currentUser.decorator';
import { UserEntity } from '@app/modules/user/user.entity';
import { MemberRejoinChatUseCase } from '../use-cases/member-join-chat.usecase';
import { AddMemberUseCase } from '../use-cases/add-member.usecase';
import {
  AddMemberDto,
  KickMemberDto,
  UnbanMemberDto,
} from '../types/chat-system.dto';
import { KickMemberUseCase } from '../use-cases/kick-member.usecase';
import { UnrestrictMemberUseCase } from '../use-cases/unrestrict-member.usecase';

@Controller('chats')
@UseGuards(JwtAuthGuard, EmailVerifiedGuard)
export class ChatSystemController {
  constructor(
    private readonly memberLeftChatUseCase: MemberLeftChatUseCase,
    private readonly memberRejoinChatUseCase: MemberRejoinChatUseCase,
    private readonly addMemberUseCase: AddMemberUseCase,
    private readonly kickMemberUseCase: KickMemberUseCase,
    private readonly unbrestrictMemberUseCase: UnrestrictMemberUseCase,
  ) {}

  @Post(':chatIdentifier/leave')
  async memberLeft(
    @CurrentUser() user: UserEntity,
    @Param('chatIdentifier') chatIdentifier: string,
  ) {
    return await this.memberLeftChatUseCase.execute({
      chatIdentifier,
      currentProfile: user.profile,
    });
  }

  @Post(':chatIdentifier/rejoin')
  async memberRejoin(
    @CurrentUser() user: UserEntity,
    @Param('chatIdentifier') chatIdentifier: string,
  ) {
    return await this.memberRejoinChatUseCase.execute({
      chatIdentifier,
      currentProfile: user.profile,
    });
  }

  @Post(':chatIdentifier/members')
  async addMember(
    @CurrentUser() user: UserEntity,
    @Param('chatIdentifier') chatIdentifier: string,
    @Body() body: AddMemberDto,
  ) {
    return await this.addMemberUseCase.execute({
      chatIdentifier,
      currentProfileId: user.profile.id,
      targetProfileId: body.targetProfileId,
    });
  }

  @Post(':chatIdentifier/kick')
  async kickMember(
    @CurrentUser() user: UserEntity,
    @Param('chatIdentifier') chatIdentifier: string,
    @Body() body: KickMemberDto,
  ) {
    return await this.kickMemberUseCase.execute({
      chatIdentifier,
      currentProfileId: user.profile.id,
      targetProfileId: body.targetProfileId,
      restrictedUntil: body.restrictedUntil,
    });
  }

  @Post(':chatIdentifier/unban')
  async unbanMember(
    @CurrentUser() user: UserEntity,
    @Param('chatIdentifier') chatIdentifier: string,
    @Body() body: UnbanMemberDto,
  ) {
    return await this.unbrestrictMemberUseCase.execute({
      chatIdentifier,
      currentProfileId: user.profile.id,
      targetProfileId: body.targetProfileId,
    });
  }
}
