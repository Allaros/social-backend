import { ChatMemberService } from '@app/modules/chat/services/chat-member.service';
import { ResolveChatByIdentifierUseCase } from '@app/modules/chat/use-cases/resolve-chat-by-identifier.usecase';
import { CreateSystemMessageUseCase } from '@app/modules/messages/use-cases/create-system-message.usecase';
import { ProfileEntity } from '@app/modules/profile/entities/profile.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ChatSystemMessages } from '../helpers/chat-system-messages';

@Injectable()
export class MemberRejoinChatUseCase {
  constructor(
    private readonly resolveChatByIdentifierUseCase: ResolveChatByIdentifierUseCase,
    private readonly chatMemberService: ChatMemberService,
    private readonly createSystemMessageUseCase: CreateSystemMessageUseCase,
    private readonly dataSource: DataSource,
  ) {}

  async execute({
    chatIdentifier,
    currentProfile,
  }: {
    chatIdentifier: string;
    currentProfile: ProfileEntity;
  }) {
    const chat = await this.resolveChatByIdentifierUseCase.execute({
      identifier: chatIdentifier,
      currentProfileId: currentProfile.id,
      options: { relations: ['members'] },
    });

    const member = chat.members.find(
      (member) => member.profileId === currentProfile.id,
    );

    if (!member) throw new NotFoundException('Участник чата не найден');

    if (!member.leftAt) {
      return { success: true };
    }

    const messageText = ChatSystemMessages.memberJoined(currentProfile);

    return await this.dataSource.transaction(async (manager) => {
      await this.chatMemberService.joinMember(member.id, manager);

      return await this.createSystemMessageUseCase.execute({
        chatId: chat.id,
        text: messageText,
        manager,
      });
    });
  }
}
