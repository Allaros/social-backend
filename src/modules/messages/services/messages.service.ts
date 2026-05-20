import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageEntity } from '../entities/messages.entity';
import { EntityManager, Repository } from 'typeorm';
import { MessagesTypeEnum } from '../types/messages.interface';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(MessageEntity)
    private readonly messagesRepository: Repository<MessageEntity>,
  ) {}

  private getRepo(manager?: EntityManager) {
    return manager
      ? manager.getRepository(MessageEntity)
      : this.messagesRepository;
  }

  async create({
    chatId,
    hasAttachments,
    senderMemberId,
    type,
    contentId,
    manager,
    replyToMessageId,
  }: {
    chatId: number;
    senderMemberId: number;
    contentId: number | null;
    replyToMessageId?: number;
    hasAttachments: boolean;
    type: MessagesTypeEnum;
    manager?: EntityManager;
  }) {
    const repo = this.getRepo(manager);

    const message = repo.create({
      chatId,
      hasAttachments,
      senderMemberId,
      type,
      contentId,
      replyToMessageId,
    });

    return await repo.save(message);
  }

  async findMessageByChatId(
    chatId: number,
    messageId: number,
    manager?: EntityManager,
  ) {
    return await this.getRepo(manager).findOne({
      where: { id: messageId, chatId },
    });
  }
}
