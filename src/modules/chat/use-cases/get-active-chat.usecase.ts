import { Injectable } from '@nestjs/common';
import { ResolveChatByIdentifierUseCase } from './resolve-chat-by-identifier.usecase';
import { ChatTypeEnum } from '../types/chat.interface';
import { ChatPermissionService } from '../services/chat-permission.service';
import { ChatQueryService } from '../services/chat-query.service';
import { ChatResponseBuilder } from '../builders/chat-response.builder';
import { PresenceStateService } from '@app/modules/websocket/services/presence-state.service';

@Injectable()
export class GetActiveChatUseCase {
  constructor(
    private readonly resolveChatByIdentifierUseCase: ResolveChatByIdentifierUseCase,
    private readonly chatPermissionService: ChatPermissionService,
    private readonly chatQueryService: ChatQueryService,
    private readonly chatResponseBuilder: ChatResponseBuilder,
    private readonly presenceStateService: PresenceStateService,
  ) {}

  async execute(currentProfileId: number, chatIdentifier: string) {
    const chat = await this.resolveChatByIdentifierUseCase.execute({
      identifier: chatIdentifier,
      currentProfileId,
    });

    const member = await this.chatPermissionService.ensureMember({
      chatId: chat.id,
      profileId: currentProfileId,
    });

    const isLeft = !!member.leftAt;

    let canSendMessages = !isLeft;

    const isMuted = member.isNotificationsMuted;

    switch (chat.type) {
      case ChatTypeEnum.DIRECT: {
        const target = await this.chatQueryService.getDirectTarget({
          currentProfileId,
          chatId: chat.id,
        });
        canSendMessages = !isLeft && !target?.leftAt;
        const isSelfChat = !target;

        if (isSelfChat) {
          return this.chatResponseBuilder.buildSingleChat({
            chat,
            type: ChatTypeEnum.DIRECT,
            target: null,
            isOnline: false,
            isSelfChat: true,
            isMuted,
            isLeft,
            canSendMessages,
          });
        }

        const isOnline = await this.presenceStateService.isOnline(
          target.profile.id,
        );

        return this.chatResponseBuilder.buildSingleChat({
          chat,
          type: ChatTypeEnum.DIRECT,
          target: target.profile,
          isOnline,
          isSelfChat: false,
          isMuted,
          isLeft,
          canSendMessages,
        });
      }
      case ChatTypeEnum.CHANNEL:
      case ChatTypeEnum.GROUP: {
        return this.chatResponseBuilder.buildSingleChat({
          chat,
          type: chat.type,
          target: null,
          isOnline: false,
          isSelfChat: false,
          isMuted,
          isLeft,
          canSendMessages,
        });
      }
    }
  }
}
