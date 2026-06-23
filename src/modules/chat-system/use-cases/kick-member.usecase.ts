import { ChatMemberService } from '@app/modules/chat/services/chat-member.service';
import { ChatPermissionService } from '@app/modules/chat/services/chat-permission.service';
import { ChatMemberRoleEnum } from '@app/modules/chat/types/chat-member.interface';
import { ResolveChatByIdentifierUseCase } from '@app/modules/chat/use-cases/resolve-chat-by-identifier.usecase';
import { CreateSystemMessageUseCase } from '@app/modules/messages/use-cases/create-system-message.usecase';
import { ProfileService } from '@app/modules/profile/services/profile.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ChatSystemMessages } from '../helpers/chat-system-messages';
import { ChatTypeEnum } from '@app/modules/chat/types/chat.interface';

@Injectable()
export class KickMemberUseCase {
  constructor(
    private readonly resolveChatByIdentifierUseCase: ResolveChatByIdentifierUseCase,
    private readonly chatPermissionService: ChatPermissionService,
    private readonly profileService: ProfileService,
    private readonly chatMemberService: ChatMemberService,
    private readonly createSystemMessageUseCase: CreateSystemMessageUseCase,
    private readonly dataSource: DataSource,
  ) {}

  async execute({
    chatIdentifier,
    currentProfileId,
    targetProfileId,
    restrictedUntil,
  }: {
    currentProfileId: number;
    targetProfileId: number;
    chatIdentifier: string;
    restrictedUntil: string | null;
  }) {
    const actorProfile = await this.profileService.findById(currentProfileId);

    if (!actorProfile) {
      throw new NotFoundException('Не удалось найти профиль');
    }

    const targetProfile = await this.profileService.findById(targetProfileId);

    if (!targetProfile) {
      throw new NotFoundException('Не удалось найти профиль');
    }

    const chat = await this.resolveChatByIdentifierUseCase.execute({
      identifier: chatIdentifier,
      currentProfileId,
    });

    if (chat.type === ChatTypeEnum.DIRECT) {
      throw new BadRequestException(
        'Нельзя исключать пользователей из личных чатов',
      );
    }

    const actorMember = await this.chatPermissionService.ensureMember({
      chatId: chat.id,
      profileId: currentProfileId,
    });

    this.chatPermissionService.ensureOwner(actorMember);

    const targetMember = await this.chatPermissionService.ensureMember({
      chatId: chat.id,
      profileId: targetProfileId,
    });

    if (currentProfileId === targetProfileId) {
      throw new BadRequestException('Нельзя ограничить самого себя');
    }

    if (targetMember.role === ChatMemberRoleEnum.OWNER) {
      throw new BadRequestException('Нельзя исключить владельца чата');
    }

    if (
      targetMember.restrictedUntil &&
      targetMember.restrictedUntil > new Date()
    ) {
      return;
    }

    const restrictTime = restrictedUntil ? new Date(restrictedUntil) : null;

    if (restrictTime && Number.isNaN(restrictTime.getTime())) {
      throw new BadRequestException('Некорректная дата ограничения');
    }

    await this.dataSource.transaction(async (manager) => {
      await this.chatMemberService.setRestriction({
        memberId: targetMember.id,
        restrictedUntil: restrictTime ?? new Date('3000-01-01T00:00:00.000Z'),
        manager,
      });

      await this.createSystemMessageUseCase.execute({
        chatId: chat.id,
        text: ChatSystemMessages.memberKicked(
          actorProfile,
          targetProfile,
          restrictTime,
        ),
        manager,
      });
    });
  }
}
