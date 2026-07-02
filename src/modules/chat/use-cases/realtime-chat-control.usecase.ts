/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { ChatResponseBuilder } from '../builders/chat-response.builder';
import { SocketEmitterService } from '@app/modules/websocket/services/socket-emitter.service';
import { ChatService } from '../services/chat.service';
import { WsChatEvents } from '@app/shared/events/ws-events';
import { ChatTypeEnum } from '../types/chat.interface';
import { ChatQueryService } from '../services/chat-query.service';

@Injectable()
export class RealtimeChatControlUseCase {
  constructor(
    private readonly chatQueryService: ChatQueryService,
    private readonly chatService: ChatService,
    private readonly chatResponseBuilder: ChatResponseBuilder,
    private readonly socketEmitter: SocketEmitterService,
  ) {}

  private readonly logger = new Logger(RealtimeChatControlUseCase.name);

  async injectChatIntoList(chatId: number) {
    const chat = await this.chatService.findById(chatId, undefined, [
      'members',
    ]);

    if (!chat) {
      return;
    }

    for (const member of chat.members) {
      const { entities, raw } =
        await this.chatQueryService.findChatForRealtimeList(
          chat.id,
          member.profileId,
        );

      const currentMember = entities[0];

      if (!currentMember) {
        continue;
      }

      const targetProfile =
        chat.type === ChatTypeEnum.DIRECT
          ? ((
              await this.chatQueryService.getDirectTarget({
                chatId: chat.id,
                currentProfileId: member.profileId,
              })
            )?.profile ?? null)
          : null;

      const lastMessage = raw[0]?.lm_id
        ? {
            text: raw[0].lm_text,
            senderName: raw[0].lm_senderName,
            senderAvatarUrl: raw[0].lm_senderAvatarUrl,
            createdAt: raw[0].lm_createdAt,
            type: raw[0].lm_type,
            attachmentsCount: Number(raw[0].lm_attachmentsCount),
          }
        : null;

      const chatResponse = this.chatResponseBuilder.buildChatListItem({
        member: currentMember,
        targetProfile,
        lastMessage,
        isOnline: false,
      });

      this.logger.log('Chat created');

      this.socketEmitter.emitToDialogs(
        member.profileId,
        WsChatEvents.CHAT_CREATED,
        chatResponse,
      );
    }
  }

  removeChatFromList(chatId: number, receiverProfileIds: number[]) {
    console.log('Chat deleted');
    receiverProfileIds.forEach((receiverProfileId) => {
      this.socketEmitter.emitToDialogs(
        receiverProfileId,
        WsChatEvents.CHAT_DELETED,
        { chatId },
      );
    });
  }
}
