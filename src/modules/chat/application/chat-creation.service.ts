import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ChatService } from '../services/chat.service';
import { ChatMemberService } from '../services/chat-member.service';
import { CreateChatMemberPayload } from '../types/chat-member.interface';
import { CreateChatPayload } from '../types/chat.interface';

@Injectable()
export class ChatCreationService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly chatService: ChatService,
    private readonly chatMemberService: ChatMemberService,
  ) {}

  async create({
    chatPayload,
    membersPayload,
  }: {
    chatPayload: CreateChatPayload;
    membersPayload: CreateChatMemberPayload[];
  }) {
    return this.dataSource.transaction(async (manager) => {
      const chat = await this.chatService.create(chatPayload, manager);

      await this.chatMemberService.createMany({
        payload: membersPayload.map((member) => ({
          ...member,
          chatId: chat.id,
        })),
        manager,
      });

      return chat;
    });
  }
}
