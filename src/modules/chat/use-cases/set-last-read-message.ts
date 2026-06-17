import { Injectable, NotFoundException } from '@nestjs/common';
import { ChatMemberService } from '../services/chat-member.service';
import { ResolveChatByIdentifierUseCase } from './resolve-chat-by-identifier.usecase';

@Injectable()
export class SetLastReadMessageUseCase {
  constructor(
    private readonly chatMemberService: ChatMemberService,
    private readonly resolveChatByIdentifierUseCase: ResolveChatByIdentifierUseCase,
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

    const unreadCount = Math.max(
      0,
      member.unreadCount - uniqueMessageIds.length,
    );

    if (!member.lastReadMessageId || member.lastReadMessageId < lastMessageId) {
      await this.chatMemberService.setLastReadMessage(
        lastMessageId,
        member.id,
        unreadCount,
      );
    }
  }
}
