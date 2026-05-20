import { Injectable } from '@nestjs/common';
import { ChatService } from '../services/chat.service';
import { ChatMemberService } from '../services/chat-member.service';
import { EntityManager } from 'typeorm';
import { ChatQueryService } from '../services/chat-query.service';

@Injectable()
export class ApplyMessageToChatUseCase {
  constructor(
    private readonly chatQueryService: ChatQueryService,
    private readonly chatService: ChatService,
    private readonly chatMemberService: ChatMemberService,
  ) {}

  async execute({
    chatId,
    messageId,
    createdAt,
    excludedMemberIds,
    manager,
  }: {
    messageId: number;
    createdAt: Date;
    chatId: number;
    excludedMemberIds?: number[];
    manager?: EntityManager;
  }) {
    const members = await this.getMembers(chatId, excludedMemberIds);

    await this.chatService.updateLastMessage({
      chatId,
      createdAt,
      messageId,
      manager,
    });

    await this.chatMemberService.incrementUnreadCountByIds({
      memberIds: members.map((member) => member.id),
      manager,
    });
  }

  private async getMembers(chatId: number, excludedMemberIds?: number[]) {
    const qb = this.chatQueryService.buildChatMembersQuery(chatId);

    this.chatQueryService.applyActiveFilter(qb);

    if (excludedMemberIds) {
      this.chatQueryService.applyExcludedMembersFilter(qb, excludedMemberIds);
    }

    const chatMembers = await qb.getMany();

    return chatMembers;
  }
}
