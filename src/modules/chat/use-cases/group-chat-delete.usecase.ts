import { BadRequestException, Injectable } from '@nestjs/common';
import { ChatPermissionService } from '../services/chat-permission.service';
import { ChatService } from '../services/chat.service';
import { ResolveChatByIdentifierUseCase } from './resolve-chat-by-identifier.usecase';
import EventEmitter2 from 'eventemitter2';
import { ChatTypeEnum } from '../types/chat.interface';
import { ChatEvents } from '@app/shared/events/domain-events';
import { ChatMarkedAsDeletedEvent } from '../events/chat-marked-as-deleted.event';

@Injectable()
export class GroupChatDeleteUseCase {
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
    });

    if (chat.deletedAt) return;

    if (chat.type !== ChatTypeEnum.GROUP)
      throw new BadRequestException('Чат не является групповым');

    const member = await this.chatPermissionService.ensureMember({
      chatId: chat.id,
      profileId: currentProfileId,
    });

    this.chatPermissionService.ensureOwner(member);

    await this.chatService.softDelete(chat.id);

    this.eventEmitter.emit(
      ChatEvents.CHAT_MARKED_AS_DELETED,
      new ChatMarkedAsDeletedEvent({ chatId: chat.id }),
    );
  }
}
