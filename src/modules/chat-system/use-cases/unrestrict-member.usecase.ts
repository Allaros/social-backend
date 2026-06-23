import { ChatMemberService } from '@app/modules/chat/services/chat-member.service';
import { ChatPermissionService } from '@app/modules/chat/services/chat-permission.service';
import { ChatMemberRoleEnum } from '@app/modules/chat/types/chat-member.interface';
import { ChatTypeEnum } from '@app/modules/chat/types/chat.interface';
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

@Injectable()
export class UnrestrictMemberUseCase {
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
  }: {
    currentProfileId: number;
    targetProfileId: number;
    chatIdentifier: string;
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
        'Нельзя управлять ограничениями в личных чатах',
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

    if (targetMember.role === ChatMemberRoleEnum.OWNER) {
      throw new BadRequestException('Нельзя управлять владельцем чата');
    }

    const isRestricted =
      targetMember.restrictedUntil && targetMember.restrictedUntil > new Date();

    if (!isRestricted) {
      return;
    }

    await this.dataSource.transaction(async (manager) => {
      await this.chatMemberService.setRestriction({
        memberId: targetMember.id,
        restrictedUntil: null,
        manager,
      });

      await this.createSystemMessageUseCase.execute({
        chatId: chat.id,
        text: ChatSystemMessages.memberUnbanned(actorProfile, targetProfile),
        manager,
      });
    });
  }
}
