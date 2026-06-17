import { Injectable } from '@nestjs/common';
import { HideMessagesService } from '../services/hide-messages.service';
import { ResolveChatByIdentifierUseCase } from '@app/modules/chat/use-cases/resolve-chat-by-identifier.usecase';
import { ChatPermissionService } from '@app/modules/chat/services/chat-permission.service';
import { MessagesService } from '../services/messages.service';

@Injectable()
export class HideMessagesUseCase {
  constructor(
    private readonly hideMessagesService: HideMessagesService,
    private readonly resolveChatByIdentifierUseCase: ResolveChatByIdentifierUseCase,
    private readonly chatPermissionService: ChatPermissionService,
    private readonly messagesService: MessagesService,
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
  }
}
