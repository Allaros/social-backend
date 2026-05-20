import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatEntity } from '../entities/chat.entity';
import { EntityManager, Repository } from 'typeorm';
import { CreateChatPayload } from '../types/chat.interface';

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

  async findByDirectKey(directKey: string, manager?: EntityManager) {
    return await this.getRepo(manager).findOne({ where: { directKey } });
  }

  async findBySlug(slug: string, manager?: EntityManager) {
    return await this.getRepo(manager).findOne({ where: { slug } });
  }

  async findById(id: number, manager?: EntityManager) {
    return await this.getRepo(manager).findOne({ where: { id } });
  }
}
