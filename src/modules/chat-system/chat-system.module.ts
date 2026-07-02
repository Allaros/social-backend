import { Module } from '@nestjs/common';
import { MessagesModule } from '../messages/messages.module';
import { ChatModule } from '../chat/chat.module';
import { ChatSystemController } from './controllers/chat-system.controller';
import { MemberLeftChatUseCase } from './use-cases/member-left-chat.usecase';
import { MemberRejoinChatUseCase } from './use-cases/member-join-chat.usecase';
import { AddMemberUseCase } from './use-cases/add-member.usecase';
import { KickMemberUseCase } from './use-cases/kick-member.usecase';
import { UnrestrictMemberUseCase } from './use-cases/unrestrict-member.usecase';
import { ProfileModule } from '../profile/profile.module';
import { InitiateGroupChatUseCase } from './use-cases/initiate-group-chat.usecase';
import { ChatCreationListener } from './listeners/chat-creation.listener';
import { CountersSelfHealingService } from './services/counters-self-healing.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [MessagesModule, ChatModule, ProfileModule, RedisModule],
  controllers: [ChatSystemController],
  providers: [
    MemberLeftChatUseCase,
    MemberRejoinChatUseCase,
    AddMemberUseCase,
    KickMemberUseCase,
    UnrestrictMemberUseCase,
    InitiateGroupChatUseCase,
    ChatCreationListener,
    CountersSelfHealingService,
  ],
})
export class ChatSystemModule {}
