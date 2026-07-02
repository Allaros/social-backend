import { Injectable, NotFoundException } from '@nestjs/common';
import { ChatMemberService } from '../services/chat-member.service';
import { ResolveChatByIdentifierUseCase } from './resolve-chat-by-identifier.usecase';
import EventEmitter2 from 'eventemitter2';
import { MessagesEvents } from '@app/shared/events/domain-events';
import { MessagesReadEvent } from '@app/modules/messages/events/messages-read.event';

@Injectable()
export class ReadMessagesUseCase {
  constructor(
    private readonly chatMemberService: ChatMemberService,
    private readonly resolveChatByIdentifierUseCase: ResolveChatByIdentifierUseCase,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute({
    chatIdentifier,
    currentProfileId,
    messageIds,
    lastMessageId,
  }: {
    messageIds: number[];
    lastMessageId: number;
    currentProfileId: number;
    chatIdentifier: string;
  }) {
    const uniqueMessageIds = [...new Set(messageIds)];
    if (!uniqueMessageIds.length) return;

    const chat = await this.resolveChatByIdentifierUseCase.execute({
      identifier: chatIdentifier,
      currentProfileId,
    });

    const member = await this.chatMemberService.findByProfileId(
      currentProfileId,
      chat.id,
    );

    if (!member) throw new NotFoundException('Участник чата не найден');

    if (!member.lastReadMessageId || member.lastReadMessageId < lastMessageId) {
      await this.chatMemberService.setLastReadMessage(lastMessageId, member.id);
    }

    this.eventEmitter.emit(
      MessagesEvents.MESSAGES_READ,
      new MessagesReadEvent({
        memberId: member.id,
        messageIds: uniqueMessageIds,
        profileId: currentProfileId,
        chatId: chat.id,
      }),
    );
  }
}
