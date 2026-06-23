import { Injectable, NotFoundException } from '@nestjs/common';
import { ChatService } from '../services/chat.service';
import { ChatParticipantsValidator } from '../validators/chat-participants.validator';
import { ChatTypeEnum, DirectChatInterface } from '../types/chat.interface';
import {
  buildDirectChatKey,
  buildSelfChatKey,
} from '../builders/chat-key.builder';
import { ChatMemberRoleEnum } from '../types/chat-member.interface';
import { ProfileEntity } from '@app/modules/profile/entities/profile.entity';
import { isPostgresUniqueViolation } from '@app/modules/profile/handlers/errorHandlers';
import { ChatCreationService } from '../application/chat-creation.service';
import { ChatResponseBuilder } from '../builders/chat-response.builder';

@Injectable()
export class CreateDirectChatUseCase {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatParticipantsValidator: ChatParticipantsValidator,
    private readonly chatCreationService: ChatCreationService,
    private readonly chatResponseBuilder: ChatResponseBuilder,
  ) {}

  async execute({
    initiatorId,
    receiverId,
  }: {
    initiatorId: number;
    receiverId: number;
  }) {
    const { existingProfiles, missingIds } =
      await this.chatParticipantsValidator.validateProfilesExist([
        initiatorId,
        receiverId,
      ]);

    const initiatorMissing = missingIds.includes(initiatorId);
    const receiverMissing = missingIds.includes(receiverId);

    if (initiatorMissing) {
      throw new NotFoundException('Инициатор не найден');
    }

    if (receiverMissing) {
      throw new NotFoundException('Получатель не найден');
    }

    const isSelfChat = initiatorId === receiverId;

    const directKey = isSelfChat
      ? buildSelfChatKey(initiatorId)
      : buildDirectChatKey(initiatorId, receiverId);

    const receiver = existingProfiles.find(
      (profile) => profile.id === receiverId,
    )!;

    const identifier = receiver.username;
    const title = receiver.name ?? receiver.username;
    const avatarUrl = receiver.avatarUrl;

    const existingChat = await this.chatService.findByDirectKey(directKey);

    if (existingChat) {
      return this.chatResponseBuilder.buildCreationResponse({
        chat: existingChat,
        identifier,
        title,
        avatarUrl,
      });
    }

    const chatPayload: DirectChatInterface = {
      directKey,
      membersCount: isSelfChat ? 1 : 2,
      type: ChatTypeEnum.DIRECT,
    };

    try {
      const chat = await this.chatCreationService.create({
        chatPayload,
        membersPayload: existingProfiles.map((profile: ProfileEntity) => {
          return {
            profileId: profile.id,
            role: ChatMemberRoleEnum.MEMBER,
          };
        }),
      });

      return this.chatResponseBuilder.buildCreationResponse({
        chat,
        identifier,
        title,
        avatarUrl,
      });
    } catch (error) {
      if (isPostgresUniqueViolation(error)) {
        const existing = await this.chatService.findByDirectKey(directKey);

        if (existing) {
          return this.chatResponseBuilder.buildCreationResponse({
            chat: existing,
            identifier,
            title,
            avatarUrl,
          });
        }
      }

      throw error;
    }
  }
}
