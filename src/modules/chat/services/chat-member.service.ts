import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatMemberEntity } from '../entities/chat-member.entity';
import { EntityManager, Repository } from 'typeorm';
import { ChatMemberRoleEnum } from '../types/chat-member.interface';

@Injectable()
export class ChatMemberService {
  constructor(
    @InjectRepository(ChatMemberEntity)
    private readonly chatMemberRepository: Repository<ChatMemberEntity>,
  ) {}

  private getRepo(manager?: EntityManager) {
    return manager
      ? manager.getRepository(ChatMemberEntity)
      : this.chatMemberRepository;
  }

  async createMany({
    payload,
    manager,
  }: {
    payload: { chatId: number; profileId: number; role: ChatMemberRoleEnum }[];
    manager?: EntityManager;
  }) {
    const repo = this.getRepo(manager);

    const newMember = repo.create(payload);

    return await repo.save(newMember);
  }

  async incrementUnreadCountByIds({
    memberIds,
    manager,
  }: {
    memberIds: number[];

    manager?: EntityManager;
  }) {
    if (!memberIds.length) return;

    await this.getRepo(manager)
      .createQueryBuilder()
      .update(ChatMemberEntity)
      .set({
        unreadCount: () => '"unreadCount" + 1',
      })
      .where('id IN (:...memberIds)', {
        memberIds,
      })
      .execute();
  }

  async findByProfileId(profileId: number, chatId: number) {
    return await this.chatMemberRepository.findOne({
      where: { profileId, chatId },
    });
  }

  async setLastReadMessage(
    messageId: number,
    memberId: number,
    unreadCount?: number,
    manager?: EntityManager,
  ) {
    await this.getRepo(manager).update(
      { id: memberId },
      { lastReadMessageId: messageId, lastReadAt: new Date(), unreadCount },
    );
  }
}
