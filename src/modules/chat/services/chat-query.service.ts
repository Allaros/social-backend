import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatMemberEntity } from '../entities/chat-member.entity';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ChatTypeEnum } from '../types/chat.interface';

@Injectable()
export class ChatQueryService {
  constructor(
    @InjectRepository(ChatMemberEntity)
    private readonly chatMemberRepository: Repository<ChatMemberEntity>,
  ) {}

  private buildBaseQuery() {
    return this.chatMemberRepository
      .createQueryBuilder('member')
      .innerJoinAndSelect('member.chat', 'chat');
  }

  buildMyChatsQuery(profileId: number) {
    const qb = this.buildBaseQuery();

    qb.where('member.profileId = :profileId', {
      profileId,
    });

    qb.andWhere('member.leftAt IS NULL');

    qb.andWhere('chat.lastMessageAt IS NOT NULL');

    qb.andWhere('chat.deletedAt IS NULL');

    return qb;
  }

  async getDirectTargets({
    currentProfileId,
    chatIds,
  }: {
    currentProfileId: number;
    chatIds: number[];
  }) {
    if (!chatIds.length) {
      return [];
    }

    return this.chatMemberRepository
      .createQueryBuilder('member')
      .innerJoinAndSelect('member.profile', 'profile')
      .where('member.chatId IN (:...chatIds)', {
        chatIds,
      })
      .andWhere('member.profileId != :currentProfileId', {
        currentProfileId,
      })
      .getMany();
  }

  async getDirectTarget({
    currentProfileId,
    chatId,
  }: {
    currentProfileId: number;
    chatId: number;
  }) {
    return this.chatMemberRepository
      .createQueryBuilder('member')
      .innerJoinAndSelect('member.profile', 'profile')
      .where('member.chatId = :chatId', { chatId })
      .andWhere('member.profileId != :currentProfileId', { currentProfileId })
      .getOne();
  }

  applyIncludedIdentifiers(
    qb: SelectQueryBuilder<ChatMemberEntity>,
    chatIds: number[],
    profileId: number,
  ) {
    if (!chatIds.length) return qb;

    qb.orWhere(
      'member.profileId = :profileId AND chat.id IN (:...includedChatIds)',
      { includedChatIds: chatIds, profileId },
    );

    return qb;
  }

  applySearch(
    qb: SelectQueryBuilder<ChatMemberEntity>,
    profileId: number,
    query?: string,
  ) {
    if (!query?.trim()) return qb;

    const normalizedQuery = `%${query.trim()}%`;

    qb.andWhere(
      `
    (
      (
        chat.type != :directType
        AND chat.title ILIKE :query
      )
      OR
      (
        chat.type = :directType
        AND EXISTS (
          SELECT 1
          FROM chat_members target_member
          INNER JOIN profiles target_profile
            ON target_profile.id = target_member.profileId
          WHERE target_member.chatId = chat.id
            AND target_member.profileId != :profileId
            AND (
              target_profile.name ILIKE :query
              OR target_profile.username ILIKE :query
            )
        )
      )
    )
    `,
      {
        query: normalizedQuery,
        profileId,
        directType: ChatTypeEnum.DIRECT,
      },
    );

    return qb;
  }

  applyVisibility(
    qb: SelectQueryBuilder<ChatMemberEntity>,
    options?: {
      archived?: boolean;
      pinned?: boolean;
    },
  ) {
    if (options?.archived !== undefined) {
      qb.andWhere('member.isArchived = :archived', {
        archived: options.archived,
      });
    }

    if (options?.pinned !== undefined) {
      qb.andWhere('member.isPinned = :pinned', {
        pinned: options.pinned,
      });
    }

    return qb;
  }

  buildChatMembersQuery(chatId: number) {
    return this.chatMemberRepository
      .createQueryBuilder('member')
      .where('member.chatId = :chatId', { chatId });
  }

  applyActiveFilter(qb: SelectQueryBuilder<ChatMemberEntity>) {
    qb.andWhere('member.leftAt IS NULL');

    return qb;
  }

  applyLastVisibleMessageJoin(qb: SelectQueryBuilder<ChatMemberEntity>) {
    qb.leftJoin(
      'messages',
      'lm',
      `
      lm.id = (
        SELECT m.id
FROM messages m
LEFT JOIN hidden_messages hm
  ON hm."messageId" = m.id
 AND hm."chatMemberId" = member.id
WHERE m."chatId" = chat.id
  AND m."deletedAt" IS NULL
  AND hm.id IS NULL
  AND (
    member."leftAt" IS NULL
    OR m."createdAt" <= member."leftAt"
  )
ORDER BY m."createdAt" DESC, m.id DESC
LIMIT 1
      )
    `,
    );

    qb.leftJoin('message_contents', 'lmc', 'lmc.id = lm."contentId"');

    qb.leftJoin(
      'chat_members',
      'lm_sender',
      'lm_sender.id = lm."senderMemberId"',
    );

    qb.leftJoin(
      'profiles',
      'lm_profile',
      'lm_profile.id = lm_sender."profileId"',
    );

    qb.addSelect('lm.id', 'lm_id');
    qb.addSelect('lm."createdAt"', 'lm_createdAt');
    qb.addSelect('lmc.content', 'lm_text');
    qb.addSelect('lm_profile.name', 'lm_senderName');
    qb.addSelect('lm.type', 'lm_type');
    qb.addSelect('lm_profile."avatarUrl"', 'lm_senderAvatarUrl');
    qb.addSelect(
      `
  (
    SELECT COUNT(*)
    FROM message_attachments ma
    WHERE ma."messageId" = lm.id
  )
  `,
      'lm_attachmentsCount',
    );

    return qb;
  }

  applyExcludedMembersFilter(
    qb: SelectQueryBuilder<ChatMemberEntity>,
    excludedMemberIds: number[],
  ) {
    if (!excludedMemberIds.length) {
      return qb;
    }

    qb.andWhere('member.id NOT IN (:...excludedMemberIds)', {
      excludedMemberIds,
    });

    return qb;
  }

  applyProfileJoin(qb: SelectQueryBuilder<ChatMemberEntity>) {
    qb.leftJoinAndSelect('member.profile', 'profile');

    return qb;
  }
}
