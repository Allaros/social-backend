import { JwtAuthGuard } from '@app/modules/auth/guards/auth.guard';
import { EmailVerifiedGuard } from '@app/modules/auth/guards/email-verified.guard';
import {
  Body,
  Controller,
  Get,
  Post,
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
} from '../types/chat.dto';
import { GetMyChatsUseCase } from '../use-cases/get-my-chats.usecase';

@Controller('chats')
@UseGuards(JwtAuthGuard, EmailVerifiedGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class ChatsController {
  constructor(
    private readonly createDirectChatUseCase: CreateDirectChatUseCase,
    private readonly createGroupChatUseCase: CreateGroupChatUseCase,
    private readonly createChannelUseCase: CreateChannelUseCase,
    private readonly getMyChatsUseCase: GetMyChatsUseCase,
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
}
