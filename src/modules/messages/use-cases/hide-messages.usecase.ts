import { Injectable } from '@nestjs/common';
import { HideMessagesService } from '../services/hide-messages.service';
import { ResolveChatByIdentifierUseCase } from '@app/modules/chat/use-cases/resolve-chat-by-identifier.usecase';
import { ChatPermissionService } from '@app/modules/chat/services/chat-permission.service';
import { MessagesService } from '../services/messages.service';
import EventEmitter2 from 'eventemitter2';
import { MessagesEvents } from '@app/shared/events/domain-events';
import { MessagesHideEvent } from '../events/messages-hide.event';

@Injectable()
export class HideMessagesUseCase {
  constructor(
    private readonly hideMessagesService: HideMessagesService,
    private readonly resolveChatByIdentifierUseCase: ResolveChatByIdentifierUseCase,
    private readonly chatPermissionService: ChatPermissionService,
    private readonly messagesService: MessagesService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute({
    chatIdentifier,
    currentProfileId,
    messageIds,
  }: {
    messageIds: number[];
    currentProfileId: number;
    chatIdentifier: string;
  }) {
    const uniqueMessageIds = [...new Set(messageIds)];

    if (!uniqueMessageIds.length) {
      return;
    }

    const chat = await this.resolveChatByIdentifierUseCase.execute({
      identifier: chatIdentifier,
      currentProfileId,
    });

    const member = await this.chatPermissionService.ensureMember({
      chatId: chat.id,
      profileId: currentProfileId,
    });

    await this.messagesService.ensureMessagesBelongsToChat(chat.id, messageIds);

    await this.hideMessagesService.create({ memberId: member.id, messageIds });

    this.eventEmitter.emit(
      MessagesEvents.MESSAGES_HIDED,
      new MessagesHideEvent({
        actorProfileId: currentProfileId,
        chatId: chat.id,
        messageIds,
      }),
    );
  }
}
