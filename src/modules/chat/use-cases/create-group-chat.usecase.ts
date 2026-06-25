import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGroupChatDto } from '../types/chat.dto';
import { ChatParticipantsValidator } from '../validators/chat-participants.validator';
import { ChatTypeEnum, GroupChatInterface } from '../types/chat.interface';
import {
  generateUniqueSlug,
  slugifyString,
} from '../builders/chat-slug.builder';
import {
  ChatMemberRoleEnum,
  CreateChatMemberPayload,
} from '../types/chat-member.interface';
import { ProfileEntity } from '@app/modules/profile/entities/profile.entity';
import { ChatCreationService } from '../application/chat-creation.service';
import { isPostgresUniqueViolation } from '@app/modules/profile/handlers/errorHandlers';
import { ChatResponseBuilder } from '../builders/chat-response.builder';
import { StorageService } from '@app/modules/file/services/storage.service';
import { BucketName } from '@app/modules/file/types/file.interface';
import { ChatEntity } from '../entities/chat.entity';
import EventEmitter2 from 'eventemitter2';
import { ChatEvents } from '@app/shared/events/domain-events';
import { ChatGroupCreatedEvent } from '../events/chat-group-created.event';

@Injectable()
export class CreateGroupChatUseCase {
  constructor(
    private readonly chatParticipantsValidator: ChatParticipantsValidator,
    private readonly chatCreationService: ChatCreationService,
    private readonly chatResponseBuilder: ChatResponseBuilder,
    private readonly storageService: StorageService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    initiatorId: number,

    payload: CreateGroupChatDto,
  ) {
    const invitedProfileIds = payload.invitedProfileIds;

    const { existingProfiles, missingIds } =
      await this.chatParticipantsValidator.validateProfilesExist([
        initiatorId,
        ...invitedProfileIds,
      ]);

    let finallyMessage: string | null = null;

    if (missingIds.includes(initiatorId))
      throw new NotFoundException('Инициатор не найден');

    if (missingIds.length > 0) {
      finallyMessage =
        'Некоторые пользователи не были добавлены, попробуйте снова';
    }

    const invitedProfiles = existingProfiles.filter(
      (profile: ProfileEntity) => profile.id !== initiatorId,
    );

    const slugifiedTitle = slugifyString(payload.title);

    const chatPayload: GroupChatInterface = {
      title: payload.title,
      avatarStorageKey: payload.avatarStorageKey,
      description: payload.description,
      isPublic: payload.isPublic ?? false,
      type: ChatTypeEnum.GROUP,
      slug: slugifiedTitle,
      membersCount: invitedProfiles.length + 1,
    };

    const membersPayload: CreateChatMemberPayload[] = [
      {
        profileId: initiatorId,
        role: ChatMemberRoleEnum.OWNER,
      },
      ...invitedProfiles.map((profile: ProfileEntity) => {
        return {
          profileId: profile.id,
          role: ChatMemberRoleEnum.MEMBER,
        };
      }),
    ];

    let chat: ChatEntity;

    try {
      chat = await this.chatCreationService.create({
        chatPayload,
        membersPayload,
      });
    } catch (error) {
      if (!isPostgresUniqueViolation(error)) {
        throw error;
      }

      const newChatPayload: GroupChatInterface = {
        ...chatPayload,
        slug: generateUniqueSlug(payload.title),
      };

      chat = await this.chatCreationService.create({
        chatPayload: newChatPayload,
        membersPayload,
      });
    }

    const avatarUrl = this.buildAvatarUrl(chat.avatarStorageKey);

    this.eventEmitter.emit(
      ChatEvents.CHAT_GROUP_CREATED,
      new ChatGroupCreatedEvent({
        chatId: chat.id,
        invitedProfileIds: invitedProfileIds,
        ownerId: initiatorId,
      }),
    );

    return this.chatResponseBuilder.buildCreationResponse({
      chat,
      identifier: chat.slug!,
      message: finallyMessage,
      title: chat.title!,
      avatarUrl,
    });
  }

  private buildAvatarUrl(storageKey?: string | null) {
    if (!storageKey) return null;

    return this.storageService.getPublicUrlFromKey(
      BucketName.CHAT_AVATARS,
      storageKey,
    );
  }
}
