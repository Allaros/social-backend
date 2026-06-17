import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HiddenMessageEntity } from '../entities/hidden-message.entity';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class HideMessagesService {
  constructor(
    @InjectRepository(HiddenMessageEntity)
    private readonly hiddenMessagesRepository: Repository<HiddenMessageEntity>,
  ) {}

  getRepo(manager?: EntityManager) {
    return manager
      ? manager.getRepository(HiddenMessageEntity)
      : this.hiddenMessagesRepository;
  }

  async create({
    memberId,
    messageIds,
    manager,
  }: {
    memberId: number;
    messageIds: number[];
    manager?: EntityManager;
  }) {
    if (!messageIds.length) {
      return;
    }

    await this.getRepo(manager)
      .createQueryBuilder()
      .insert()
      .into(HiddenMessageEntity)
      .values(
        messageIds.map((messageId) => ({
          chatMemberId: memberId,
          messageId,
        })),
      )
      .orIgnore()
      .execute();
  }
}
