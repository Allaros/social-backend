import { JwtAuthGuard } from '@app/modules/auth/guards/auth.guard';
import { EmailVerifiedGuard } from '@app/modules/auth/guards/email-verified.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CreateDirectChatUseCase } from '../use-cases/create-direct-chat.usecase';
import { CreateGroupChatUseCase } from '../use-cases/create-group-chat.usecase';
import { CreateChannelUseCase } from '../use-cases/create-channel.usecase';
import { CurrentUser } from '@app/shared/decorators/currentUser.decorator';
import { UserEntity } from '@app/modules/user/user.entity';
import {
  CreateChannelDto,
  CreateDirectChatDto,
  CreateGroupChatDto,
  GetMyChatsDto,
  SetLastReadMessageDto,
} from '../types/chat.dto';
import { GetMyChatsUseCase } from '../use-cases/get-my-chats.usecase';
import { GetActiveChatUseCase } from '../use-cases/get-active-chat.usecase';
import { SetLastReadMessageUseCase } from '../use-cases/set-last-read-message';
import { DeleteDirectUseCase } from '../use-cases/delete-direct.usecase';
import { GroupChatDeleteUseCase } from '../use-cases/group-chat-delete.usecase';
import { ToggleChatNotificationsUseCase } from '../use-cases/toggle-chat-notifications.usecase';

@Controller('chats')
@UseGuards(JwtAuthGuard, EmailVerifiedGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class ChatsController {
  constructor(
    private readonly createDirectChatUseCase: CreateDirectChatUseCase,
    private readonly createGroupChatUseCase: CreateGroupChatUseCase,
    private readonly createChannelUseCase: CreateChannelUseCase,
    private readonly getMyChatsUseCase: GetMyChatsUseCase,
    private readonly getActiveChatUseCase: GetActiveChatUseCase,
    private readonly setLastReadMessageUseCase: SetLastReadMessageUseCase,
    private readonly deleteDirectUseCase: DeleteDirectUseCase,
    private readonly groupChatDeleteUseCase: GroupChatDeleteUseCase,
    private readonly toggleChatNotificationsUseCase: ToggleChatNotificationsUseCase,
  ) {}

  @Get()
  getMyChats(@CurrentUser() user: UserEntity, @Query() query: GetMyChatsDto) {
    return this.getMyChatsUseCase.execute({
      profileId: user.profile.id,
      query: query.search,
      archived: query.archived,
      pinned: query.pinned,
      cursor: query.cursor,
      limit: query.limit,
      includedIdentifiers: query.includedIdentifiers,
    });
  }

  @Get(':identifier')
  getActiveChat(
    @CurrentUser() user: UserEntity,
    @Param('identifier') identifier: string,
  ) {
    return this.getActiveChatUseCase.execute(user.profile.id, identifier);
  }

  @Post('direct')
  createDirectChat(
    @CurrentUser() user: UserEntity,
    @Body() body: CreateDirectChatDto,
  ) {
    return this.createDirectChatUseCase.execute({
      initiatorId: user.profile.id,
      receiverId: body.receiverId,
    });
  }

  @Post('group')
  createGroupChat(
    @CurrentUser() user: UserEntity,
    @Body() body: CreateGroupChatDto,
  ) {
    return this.createGroupChatUseCase.execute(user.profile.id, {
      title: body.title,
      avatarStorageKey: body.avatarStorageKey,
      description: body.description,
      isPublic: body.isPublic,
      invitedProfilesIds: body.invitedProfilesIds,
    });
  }

  @Post('channel')
  createChannel(
    @CurrentUser() user: UserEntity,
    @Body() body: CreateChannelDto,
  ) {
    return this.createChannelUseCase.execute(user.profile.id, body);
  }

  @Put(':identifier/read')
  setLastReadMessages(
    @Body() dto: SetLastReadMessageDto,
    @CurrentUser() user: UserEntity,
    @Param('identifier') identifier: string,
  ) {
    console.log('[SET_READ_MESSAGES_DTO]', dto);
    return this.setLastReadMessageUseCase.execute({
      chatIdentifier: identifier,
      currentProfileId: user.profile.id,
      lastMessageId: dto.lastMessageId,
      messageIds: dto.messageIds,
    });
  }

  @Delete(':identifier/delete/direct')
  async deleteDirectChat(
    @Param('identifier') chatIdentifier: string,
    @CurrentUser() user: UserEntity,
  ) {
    await this.deleteDirectUseCase.execute({
      chatIdentifier,
      currentProfileId: user.profile.id,
    });
  }

  @Delete(':identifier/delete/direct')
  async deleteGroupChat(
    @Param('identifier') chatIdentifier: string,
    @CurrentUser() user: UserEntity,
  ) {
    await this.groupChatDeleteUseCase.execute({
      chatIdentifier,
      currentProfileId: user.profile.id,
    });
  }

  @Put(':identifier/toggle-mute')
  async toggleMute(
    @Param('identifier') chatIdentifier: string,
    @CurrentUser() user: UserEntity,
  ) {
    await this.toggleChatNotificationsUseCase.execute({
      chatIdentifier,
      currentProfileId: user.profile.id,
    });
  }
}
