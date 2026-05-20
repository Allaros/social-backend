import { Injectable, NotFoundException } from '@nestjs/common';
import { ChatParticipantsValidator } from '../validators/chat-participants.validator';
import { ChatCreationService } from '../application/chat-creation.service';
import {
  generateUniqueSlug,
  slugifyString,
} from '../builders/chat-slug.builder';
import { isPostgresUniqueViolation } from '@app/modules/profile/handlers/errorHandlers';
import {
  CreateChatMemberPayload,
  ChatMemberRoleEnum,
} from '../types/chat-member.interface';
import { CreateChannelDto } from '../types/chat.dto';
import { ChannelInterface, ChatTypeEnum } from '../types/chat.interface';

@Injectable()
export class CreateChannelUseCase {
  constructor(
    private readonly chatParticipantsValidator: ChatParticipantsValidator,
    private readonly chatCreationService: ChatCreationService,
  ) {}

  async execute(initiatorId: number, payload: CreateChannelDto) {
    const { missingIds } =
      await this.chatParticipantsValidator.validateProfilesExist([initiatorId]);

    if (missingIds.includes(initiatorId)) {
      throw new NotFoundException('Инициатор не найден');
    }

    const slugifiedTitle = slugifyString(payload.title);

    const chatPayload: ChannelInterface = {
      ...payload,

      type: ChatTypeEnum.CHANNEL,

      isPublic: payload.isPublic ?? false,

      slug: slugifiedTitle,
    };

    const membersPayload: CreateChatMemberPayload[] = [
      {
        profileId: initiatorId,

        role: ChatMemberRoleEnum.OWNER,
      },
    ];

    try {
      return await this.chatCreationService.create({
        chatPayload,
        membersPayload,
      });
    } catch (error) {
      if (isPostgresUniqueViolation(error)) {
        const retryPayload: ChannelInterface = {
          ...payload,

          type: ChatTypeEnum.CHANNEL,

          isPublic: payload.isPublic ?? false,

          slug: generateUniqueSlug(payload.title),
        };

        return await this.chatCreationService.create({
          chatPayload: retryPayload,
          membersPayload,
        });
      }

      throw error;
    }
  }
}
