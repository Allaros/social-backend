import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageEntity } from '../entities/messages.entity';
import { EntityManager, In, Repository } from 'typeorm';
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
    forwardedFromId,
    clientId,
  }: {
    chatId: number;
    senderMemberId: number | null;
    contentId: number | null;
    replyToMessageId?: number;
    hasAttachments: boolean;
    type: MessagesTypeEnum;
    forwardedFromId?: number;
    manager?: EntityManager;
    clientId?: string;
  }) {
    const repo = this.getRepo(manager);

    const message = repo.create({
      chatId,
      hasAttachments,
      senderMemberId,
      type,
      contentId,
      replyToMessageId,
      forwardedFromMessageId: forwardedFromId,
      clientId,
    });

    return await repo.save(message);
  }

  async ensureMessageBelongsToChat(
    chatId: number,
    messageId: number,
    manager?: EntityManager,
    relations?: Array<'attachments' | 'content'>,
  ) {
    const message = await this.getRepo(manager).findOne({
      where: { id: messageId, chatId },
      relations,
    });

    if (!message)
      throw new NotFoundException('Сообщение в данном чате не найдено');

    return message;
  }

  async ensureMessagesBelongsToChat(
    chatId: number,
    messageIds: number[],
    manager?: EntityManager,
    relations?: Array<'attachments' | 'content'>,
  ) {
    const messages = await this.getRepo(manager).find({
      where: {
        chatId,
        id: In(messageIds),
      },
      relations,
    });

    if (messages.length !== messageIds.length) {
      throw new NotFoundException('Некоторые сообщения не принадлежат чату');
    }

    return messages;
  }

  async findMany(
    messageIds: number[],
    manager?: EntityManager,
    relations?: Array<'attachments' | 'content'>,
  ) {
    return await this.getRepo(manager).find({
      where: {
        id: In(messageIds),
      },
      relations,
    });
  }

  async findOne(
    messageId: number,
    manager?: EntityManager,
    relations?: Array<'attachments' | 'content'>,
  ) {
    return await this.getRepo(manager).findOne({
      where: {
        id: messageId,
      },
      relations,
    });
  }

  async messagesDelete(
    chatId: number,
    messageIds: number[],
    manager?: EntityManager,
  ) {
    if (!messageIds.length) {
      return;
    }

    await this.getRepo(manager).update(
      {
        chatId,
        id: In(messageIds),
      },
      {
        contentId: null,
        hasAttachments: false,
        replyToMessageId: null,
        deletedAt: new Date(),
      },
    );
  }

  async messagesHardDelete(
    chatId: number,
    messageIds: number[],
    manager?: EntityManager,
  ) {
    if (!messageIds.length) {
      return;
    }

    await this.getRepo(manager).delete({
      chatId,
      id: In(messageIds),
    });
  }

  async messageUpdate(
    messageId: number,
    updatePayload: Partial<MessageEntity>,
    manager?: EntityManager,
  ) {
    await this.getRepo(manager).update({ id: messageId }, updatePayload);
  }

  async getBatchIdsForDeletion(
    chatId: number,
    limit: number,
  ): Promise<number[]> {
    const rows = await this.messagesRepository
      .createQueryBuilder('message')
      .select('message.id', 'id')
      .where('message.chatId = :chatId', { chatId })
      .orderBy('message.id', 'ASC')
      .limit(limit)
      .getRawMany<{ id: number }>();

    return rows.map((row) => Number(row.id));
  }

  async getLastMessage(chatId: number, manager: EntityManager) {
    return manager
      .getRepository(MessageEntity)
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.content', 'content')
      .leftJoinAndSelect('message.attachments', 'attachments')
      .leftJoinAndSelect('message.senderMember', 'senderMember')
      .leftJoinAndSelect('senderMember.profile', 'profile')
      .where('message.chatId = :chatId', { chatId })
      .andWhere('message.deletedAt IS NULL')
      .orderBy('message.createdAt', 'DESC')
      .limit(1)
      .getOne();
  }
}
