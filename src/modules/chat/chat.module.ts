import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileModule } from '../profile/profile.module';
import { FileModule } from '../file/file.module';
import { ChatEntity } from './entities/chat.entity';
import { ChatMemberEntity } from './entities/chat-member.entity';
import { ChatsController } from './controllers/chat.controller';
import { ChatService } from './services/chat.service';
import { ChatMemberService } from './services/chat-member.service';
import { ChatPermissionService } from './services/chat-permission.service';
import { ChatQueryService } from './services/chat-query.service';
import { ChatCreationService } from './application/chat-creation.service';
import { ChatResponseBuilder } from './builders/chat-response.builder';
import { ChatParticipantsValidator } from './validators/chat-participants.validator';
import { CreateDirectChatUseCase } from './use-cases/create-direct-chat.usecase';
import { CreateGroupChatUseCase } from './use-cases/create-group-chat.usecase';
import { CreateChannelUseCase } from './use-cases/create-channel.usecase';
import { ApplyMessageToChatUseCase } from './use-cases/apply-message-to-chat.usecase';
import { GetMyChatsUseCase } from './use-cases/get-my-chats.usecase';
import { ResolveChatByIdentifierUseCase } from './use-cases/resolve-chat-by-identifier.usecase';
import { WebsocketModule } from '../websocket/websocket.module';
import { GetActiveChatUseCase } from './use-cases/get-active-chat.usecase';
import { SetLastReadMessageUseCase } from './use-cases/set-last-read-message';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatEntity, ChatMemberEntity]),
    ProfileModule,
    FileModule,
    WebsocketModule,
  ],
  controllers: [ChatsController],
  providers: [
    ChatService,
    ChatMemberService,
    ChatPermissionService,
    ChatQueryService,
    ChatCreationService,
    ChatResponseBuilder,
    ChatParticipantsValidator,
    CreateDirectChatUseCase,
    CreateGroupChatUseCase,
    CreateChannelUseCase,
    ApplyMessageToChatUseCase,
    GetMyChatsUseCase,
    ResolveChatByIdentifierUseCase,
    GetActiveChatUseCase,
    SetLastReadMessageUseCase,
  ],
  exports: [
    ChatService,
    ChatMemberService,
    ChatPermissionService,
    ChatQueryService,
    ApplyMessageToChatUseCase,
    ResolveChatByIdentifierUseCase,
  ],
})
export class ChatModule {}
