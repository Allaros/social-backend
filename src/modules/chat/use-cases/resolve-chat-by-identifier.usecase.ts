import { ProfileService } from '@app/modules/profile/services/profile.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ChatService } from '../services/chat.service';
import {
  buildDirectChatKey,
  buildSelfChatKey,
} from '../builders/chat-key.builder';

@Injectable()
export class ResolveChatByIdentifierUseCase {
  constructor(
    private readonly profileService: ProfileService,
    private readonly chatService: ChatService,
  ) {}

  async execute({
    identifier,
    currentProfileId,
    options,
  }: {
    identifier: string;
    currentProfileId: number;
    options?: {
      relations?: Array<'members'>;
    };
  }) {
    const groupChat = await this.chatService.findBySlug(
      identifier,
      options?.relations,
    );

    if (groupChat) {
      if (groupChat.deletedAt) {
        throw new NotFoundException('Чат не найден');
      }
      return groupChat;
    }

    const targetProfile = await this.profileService.findByUsername(identifier);

    if (!targetProfile) {
      throw new NotFoundException('Чат не найден');
    }

    const directKey =
      targetProfile.id === currentProfileId
        ? buildSelfChatKey(currentProfileId)
        : buildDirectChatKey(currentProfileId, targetProfile.id);

    const directChat = await this.chatService.findByDirectKey(
      directKey,
      options?.relations,
    );

    if (!directChat || directChat.deletedAt) {
      throw new NotFoundException('Чат не найден');
    }

    return directChat;
  }
}
