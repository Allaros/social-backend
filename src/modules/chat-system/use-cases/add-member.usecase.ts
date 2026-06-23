import { ChatMemberService } from '@app/modules/chat/services/chat-member.service';
import { ChatPermissionService } from '@app/modules/chat/services/chat-permission.service';
import { ChatMemberRoleEnum } from '@app/modules/chat/types/chat-member.interface';
import { ChatTypeEnum } from '@app/modules/chat/types/chat.interface';
import { ResolveChatByIdentifierUseCase } from '@app/modules/chat/use-cases/resolve-chat-by-identifier.usecase';
import { ProfileService } from '@app/modules/profile/services/profile.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ChatSystemMessages } from '../helpers/chat-system-messages';
import { CreateSystemMessageUseCase } from '@app/modules/messages/use-cases/create-system-message.usecase';

@Injectable()
export class AddMemberUseCase {
  constructor(
    private readonly resolveChatByIdentifierUseCase: ResolveChatByIdentifierUseCase,
    private readonly chatPermissionService: ChatPermissionService,
    private readonly chatMemberService: ChatMemberService,
    private readonly createSystemMessageUseCase: CreateSystemMessageUseCase,
    private readonly profileService: ProfileService,
    private readonly dataSource: DataSource,
  ) {}

  async execute({
    chatIdentifier,
    currentProfileId,
    targetProfileId,
  }: {
    currentProfileId: number;
    chatIdentifier: string;
    targetProfileId: number;
  }) {
    const actorProfile = await this.profileService.findById(currentProfileId);

    if (!actorProfile) throw new NotFoundException('Не удалось найти профиль');

    const targetProfile = await this.profileService.findById(targetProfileId);

    if (!targetProfile) throw new NotFoundException('Не удалось найти профиль');

    const chat = await this.resolveChatByIdentifierUseCase.execute({
      identifier: chatIdentifier,
      currentProfileId,
    });

    if (chat.type === ChatTypeEnum.DIRECT)
      throw new BadRequestException(
        'Нельзя добавлять пользователей в личные чаты',
      );

    const actorMember = await this.chatPermissionService.ensureMember({
      chatId: chat.id,
      profileId: currentProfileId,
    });

    if (!chat.isPublic) {
      this.chatPermissionService.ensureOwner(actorMember);
    }

    const targetMember = await this.chatPermissionService.getMember({
      chatId: chat.id,
      profileId: targetProfileId,
    });

    if (targetMember) return;

    await this.dataSource.transaction(async (manager) => {
      await this.chatMemberService.createMany({
        payload: [
          {
            chatId: chat.id,
            profileId: targetProfile.id,
            role: ChatMemberRoleEnum.MEMBER,
          },
        ],
        manager,
      });

      const messageText = ChatSystemMessages.memberAdded(
        actorProfile,
        targetProfile,
      );

      await this.createSystemMessageUseCase.execute({
        chatId: chat.id,
        text: messageText,
        manager,
      });
    });
  }
}
