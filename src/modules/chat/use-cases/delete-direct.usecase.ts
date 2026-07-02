import { BadRequestException, Injectable } from '@nestjs/common';
import { ChatPermissionService } from '../services/chat-permission.service';
import { ResolveChatByIdentifierUseCase } from './resolve-chat-by-identifier.usecase';
import { ChatTypeEnum } from '../types/chat.interface';
import { ChatService } from '../services/chat.service';
import EventEmitter2 from 'eventemitter2';
import { ChatEvents } from '@app/shared/events/domain-events';
import { ChatMarkedAsDeletedEvent } from '../events/chat-marked-as-deleted.event';

@Injectable()
export class DeleteDirectUseCase {
  constructor(
    private readonly chatPermissionService: ChatPermissionService,
    private readonly chatService: ChatService,
    private readonly resolveChatByIdentifierUseCase: ResolveChatByIdentifierUseCase,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute({
    chatIdentifier,
    currentProfileId,
  }: {
    chatIdentifier: string;
    currentProfileId: number;
  }) {
    const chat = await this.resolveChatByIdentifierUseCase.execute({
      identifier: chatIdentifier,
      currentProfileId,
      options: {
        relations: ['members'],
      },
    });

    if (chat.deletedAt) return;

    if (chat.type !== ChatTypeEnum.DIRECT)
      throw new BadRequestException('Чат не является личным');

    await this.chatPermissionService.ensureMember({
      chatId: chat.id,
      profileId: currentProfileId,
    });

    await this.chatService.clearDirectKey(chat.id);

    await this.chatService.softDelete(chat.id);

    const memberProfileIds = chat.members.map((member) => member.profileId);

    this.eventEmitter.emit(
      ChatEvents.CHAT_MARKED_AS_DELETED,
      new ChatMarkedAsDeletedEvent({
        chatId: chat.id,
        receiverProfileIds: memberProfileIds,
      }),
    );
  }
}
