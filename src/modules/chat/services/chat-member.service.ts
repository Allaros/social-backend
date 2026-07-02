import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatMemberEntity } from '../entities/chat-member.entity';
import { EntityManager, In, IsNull, Repository } from 'typeorm';
import { ChatMemberRoleEnum } from '../types/chat-member.interface';
import { MessageEntity } from '@app/modules/messages/entities/messages.entity';

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

  async getUnreadStateForProfile(profileId: number) {
    const result = await this.chatMemberRepository
      .createQueryBuilder('member')
      .select(
        `
    COUNT(*) FILTER (
      WHERE member."isNotificationsMuted" = false
    )
    `,
        'normal',
      )
      .addSelect(
        `
    COUNT(*) FILTER (
      WHERE member."isNotificationsMuted" = true
    )
    `,
        'muted',
      )
      .where('member.profileId = :profileId', { profileId })
      .andWhere('member."leftAt" IS NULL')
      .andWhere('member."restrictedUntil" IS NULL')
      .andWhere('member."unreadCount" > 0')
      .getRawOne<{
        normal: string;
        muted: string;
      }>();

    return {
      unreadMutedChatsCount: Number(result?.muted ?? 0),
      unreadChatsCount: Number(result?.normal ?? 0),
    };
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

  async findById(memberId: number) {
    return await this.chatMemberRepository.findOne({ where: { id: memberId } });
  }

  async findByIds(memberIds: number[]) {
    return await this.chatMemberRepository.find({
      where: { id: In(memberIds) },
    });
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

  async getActiveMembers(chatId: number) {
    return await this.chatMemberRepository.find({
      where: { chatId, leftAt: IsNull(), restrictedUntil: IsNull() },
    });
  }

  async setLastReadMessage(
    messageId: number,
    memberId: number,
    manager?: EntityManager,
  ) {
    await this.getRepo(manager).update(
      { id: memberId },
      { lastReadMessageId: messageId, lastReadAt: new Date() },
    );
  }

  async markAsLeft(memberId: number, manager?: EntityManager) {
    await this.getRepo(manager).update(
      { id: memberId },
      { leftAt: new Date() },
    );
  }

  async joinMember(memberId: number, manager?: EntityManager) {
    await this.getRepo(manager).update(
      { id: memberId },
      { leftAt: null, joinedAt: new Date() },
    );
  }

  async setRestriction({
    memberId,
    restrictedUntil,
    manager,
  }: {
    memberId: number;
    restrictedUntil: Date | null;
    manager?: EntityManager;
  }) {
    await this.getRepo(manager).update({ id: memberId }, { restrictedUntil });
  }

  async clearExpiredRestrictions() {
    await this.chatMemberRepository
      .createQueryBuilder()
      .update()
      .set({
        restrictedUntil: null,
      })
      .where('restrictedUntil IS NOT NULL')
      .andWhere('restrictedUntil <= NOW()')
      .execute();
  }

  async toggleNotification({
    currentNotificationStatus,
    memberId,
    manager,
  }: {
    memberId: number;
    currentNotificationStatus: boolean;
    manager?: EntityManager;
  }) {
    await this.getRepo(manager).update(
      { id: memberId },
      { isNotificationsMuted: !currentNotificationStatus },
    );
  }

  async changeUnreadCount(
    memberIds: number[],
    delta: number,
    manager?: EntityManager,
  ) {
    if (!memberIds.length) return;

    await this.getRepo(manager)
      .createQueryBuilder()
      .update(ChatMemberEntity)
      .set({
        unreadCount: () => `GREATEST("unreadCount" + (${delta}), 0)`,
      })
      .whereInIds(memberIds)
      .execute();
  }

  async setUnreadCount(
    memberId: number,
    count: number,
    manager?: EntityManager,
  ) {
    await this.getRepo(manager).update(
      { id: memberId },
      { unreadCount: count },
    );
  }

  async changeUnreadCountBatch(
    updates: {
      memberId: number;
      delta: number;
    }[],
    manager?: EntityManager,
  ) {
    if (!updates.length) {
      return [];
    }

    const repo = this.getRepo(manager);

    const ids = updates.map((u) => u.memberId);

    const members = await repo.find({
      where: { id: In(ids) },
      select: {
        id: true,
        profileId: true,
        unreadCount: true,
        isNotificationsMuted: true,
      },
    });

    const memberMap = new Map(members.map((member) => [member.id, member]));

    const cases = updates
      .map(
        ({ memberId, delta }) =>
          `WHEN id = ${memberId} THEN GREATEST("unreadCount" + (${delta}), 0)`,
      )
      .join(' ');

    await repo
      .createQueryBuilder()
      .update(ChatMemberEntity)
      .set({
        unreadCount: () => `
        CASE
          ${cases}
          ELSE "unreadCount"
        END
      `,
      })
      .whereInIds(ids)
      .execute();

    return updates.flatMap(({ memberId, delta }) => {
      const member = memberMap.get(memberId);

      if (!member) {
        return [];
      }

      const before = member.unreadCount;
      const after = Math.max(before + delta, 0);

      return [
        {
          memberId,
          profileId: member.profileId,
          muted: member.isNotificationsMuted,
          before,
          after,

          becameUnread: before === 0 && after > 0,
          becameRead: before > 0 && after === 0,
        },
      ];
    });
  }

  async countDeletedUnreadMessagesForMembers({
    memberIds,
    deletedMessageIds,
  }: {
    memberIds: number[];
    deletedMessageIds: number[];
  }) {
    if (!memberIds.length || !deletedMessageIds.length) {
      return new Map<number, number>();
    }

    const rows = await this.chatMemberRepository
      .createQueryBuilder('member')
      .innerJoin(MessageEntity, 'message', 'message.chatId = member.chatId')
      .select('member.id', 'memberId')
      .addSelect('COUNT(message.id)', 'count')
      .where('member.id IN (:...memberIds)', {
        memberIds,
      })
      .andWhere('message.id IN (:...deletedMessageIds)', {
        deletedMessageIds,
      })
      .andWhere(
        `
      (
        member.lastReadMessageId IS NULL
        OR message.id > member.lastReadMessageId
      )
      `,
      )
      .groupBy('member.id')
      .getRawMany<{
        memberId: string;
        count: string;
      }>();

    return new Map(
      rows.map((row) => [Number(row.memberId), Number(row.count)]),
    );
  }
}
