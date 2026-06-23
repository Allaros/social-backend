import { Injectable } from '@nestjs/common';
import { ResolveChatByIdentifierUseCase } from './resolve-chat-by-identifier.usecase';
import { ChatPermissionService } from '../services/chat-permission.service';
import { ChatMemberService } from '../services/chat-member.service';

@Injectable()
export class ToggleChatNotificationsUseCase {
  constructor(
    private readonly resolveChatByIdentifier: ResolveChatByIdentifierUseCase,
    private readonly chatPermissionService: ChatPermissionService,
    private readonly chatMemberService: ChatMemberService,
  ) {}

  async execute({
    chatIdentifier,
    currentProfileId,
  }: {
    chatIdentifier: string;
    currentProfileId: number;
  }) {
    const chat = await this.resolveChatByIdentifier.execute({
      identifier: chatIdentifier,
      currentProfileId,
    });

    const member = await this.chatPermissionService.ensureMember({
      chatId: chat.id,
      profileId: currentProfileId,
    });

    await this.chatMemberService.toggleNotification({
      currentNotificationStatus: member.isNotificationsMuted,
      memberId: member.id,
    });

    return {
      isNotificationsMuted: !member.isNotificationsMuted,
    };
  }
}
