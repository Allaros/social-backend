import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageContentEntity } from '../entities/messages-content.entity';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class MessagesContentService {
  constructor(
    @InjectRepository(MessageContentEntity)
    private readonly messageContentRepository: Repository<MessageContentEntity>,
  ) {}

  private getRepo(manager?: EntityManager) {
    return manager
      ? manager.getRepository(MessageContentEntity)
      : this.messageContentRepository;
  }

  async create({
    content,
    isEncrypted = false,
    manager,
  }: {
    content: string;
    isEncrypted: boolean;
    manager?: EntityManager;
  }) {
    const repo = this.getRepo(manager);

    const contentEntity = repo.create({
      content,
      isEncrypted,
    });

    return repo.save(contentEntity);
  }
}
