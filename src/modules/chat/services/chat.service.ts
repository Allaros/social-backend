import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatEntity } from '../entities/chat.entity';
import { EntityManager, Repository } from 'typeorm';
import { CreateChatPayload } from '../types/chat.interface';
import { MessageEntity } from '@app/modules/messages/entities/messages.entity';

type RealtimeChat = ChatEntity & {
  lastMessage: MessageEntity | null;
};

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatEntity)
    private readonly chatRepository: Repository<ChatEntity>,
  ) {}

  private getRepo(manager?: EntityManager) {
    return manager ? manager.getRepository(ChatEntity) : this.chatRepository;
  }

  async create(payload: CreateChatPayload, manager?: EntityManager) {
    const repo = this.getRepo(manager);

    const newChat = repo.create(payload);

    return await repo.save(newChat);
  }

  async updateLastMessage({
    chatId,
    createdAt,
    messageId,
    manager,
  }: {
    chatId: number;
    messageId: number;
    createdAt: Date;
    manager?: EntityManager;
  }) {
    await this.getRepo(manager).update(
      { id: chatId },
      { lastMessageId: messageId, lastMessageAt: createdAt },
    );
  }

  async initializeChat(chatId: number, manager?: EntityManager) {
    await this.getRepo(manager).update({ id: chatId }, { isInitialized: true });
  }

  async findByDirectKey(
    directKey: string,
    relations?: Array<'members'>,
    manager?: EntityManager,
  ) {
    return await this.getRepo(manager).findOne({
      where: { directKey },
      relations,
    });
  }

  async findBySlug(
    slug: string,
    relations?: Array<'members'>,
    manager?: EntityManager,
  ) {
    return await this.getRepo(manager).findOne({ where: { slug }, relations });
  }

  async findById(
    id: number,
    manager?: EntityManager,
    relations?: Array<string>,
  ) {
    return await this.getRepo(manager).findOne({ where: { id }, relations });
  }

  async hardDelete(chatId: number, manager?: EntityManager) {
    await this.getRepo(manager).delete({ id: chatId });
  }

  async softDelete(chatId: number, manager?: EntityManager) {
    await this.getRepo(manager).update(
      { id: chatId },
      { deletedAt: new Date() },
    );
  }

  async clearDirectKey(chatId: number, manager?: EntityManager) {
    await this.getRepo(manager).update(chatId, { directKey: null });
  }

  async clearSlug(chatId: number, manager?: EntityManager) {
    await this.getRepo(manager).update(chatId, { slug: null });
  }

  async getChatsBatchAfterId({
    afterId,
    limit,
  }: {
    afterId: number;
    limit: number;
  }) {
    return this.chatRepository
      .createQueryBuilder('chat')
      .where('chat.id > :afterId', {
        afterId,
      })
      .andWhere('chat.deletedAt IS NULL')
      .andWhere(`chat.lastMessageAt > NOW() - INTERVAL '30 days'`)
      .orderBy('chat.id', 'ASC')
      .limit(limit)
      .getMany();
  }

  async findRealtimeChat(chatId: number) {
    const chat = await this.chatRepository
      .createQueryBuilder('chat')

      .leftJoinAndSelect('chat.members', 'member')
      .leftJoinAndSelect('member.profile', 'profile')

      .where('chat.id = :chatId', { chatId })

      .getOne();

    return chat as RealtimeChat;
  }
}
