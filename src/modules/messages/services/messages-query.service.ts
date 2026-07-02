import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageEntity } from '../entities/messages.entity';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CursorCodec } from '@app/shared/cursor/codec/cursor-codec';
import { CompositeCursorConfig } from '@app/shared/cursor/types/cursor.interface';
import { CompositeCursorQueryHelper } from '@app/shared/cursor/helpers/composite-cursor-qb';

type MessageCursor = {
  id: number;
  createdAt: string;
};

const MESSAGE_CURSOR_CONFIG: CompositeCursorConfig<MessageCursor> = {
  fields: [
    { key: 'createdAt', column: 'message.createdAt' },
    { key: 'id', column: 'message.id' },
  ],
  order: 'DESC',
};

export const messageCodec = new CursorCodec<MessageCursor>(['id', 'createdAt']);

@Injectable()
export class MessagesQueryService {
  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
  ) {}

  async findRealtimeMessage(messageId: number) {
    return this.messageRepository
      .createQueryBuilder('message')

      .leftJoinAndSelect('message.content', 'content')
      .leftJoinAndSelect('message.attachments', 'attachments')

      .leftJoinAndSelect('message.senderMember', 'senderMember')
      .leftJoinAndSelect('senderMember.profile', 'senderProfile')

      .leftJoinAndSelect('message.replyToMessage', 'reply')
      .leftJoinAndSelect('reply.content', 'replyContent')
      .leftJoinAndSelect('reply.senderMember', 'replySender')
      .leftJoinAndSelect('replySender.profile', 'replySenderProfile')

      .leftJoinAndSelect('message.forwardedFromMessage', 'forwarded')
      .leftJoinAndSelect('forwarded.senderMember', 'forwardedSender')
      .leftJoinAndSelect('forwardedSender.profile', 'forwardedSenderProfile')

      .where('message.id = :messageId', { messageId })

      .getOne();
  }

  buildIdsQuery(chatId: number) {
    return this.messageRepository
      .createQueryBuilder('message')
      .select(['message.id', 'message.createdAt'])
      .where('message.chatId = :chatId', { chatId })
      .andWhere('message.deletedAt IS NULL')
      .orderBy('message.createdAt', 'DESC')
      .addOrderBy('message.id', 'DESC');
  }

  buildDataQuery(ids: number[]) {
    const qb = this.messageRepository
      .createQueryBuilder('message')
      .where('message.id IN (:...ids)', { ids })
      .orderBy('message.createdAt', 'DESC')
      .addOrderBy('message.id', 'DESC');

    return qb;
  }

  applyCursor(qb: SelectQueryBuilder<MessageEntity>, cursor?: string) {
    const decoded = messageCodec.decode(cursor);

    CompositeCursorQueryHelper.applyCompositeCursor(
      qb,
      decoded,
      MESSAGE_CURSOR_CONFIG,
    );

    return qb;
  }

  applyLeftAtVisibility(
    qb: SelectQueryBuilder<MessageEntity>,
    leftAt?: Date | null,
  ) {
    if (!leftAt) {
      return qb;
    }

    qb.andWhere('message."createdAt" <= :leftAt', {
      leftAt,
    });

    return qb;
  }

  applyHiddenMessagesFilter(
    qb: SelectQueryBuilder<MessageEntity>,
    memberId: number,
  ) {
    qb.andWhere(
      `
    NOT EXISTS (
      SELECT 1
      FROM hidden_messages hiddenMessage
      WHERE hiddenMessage."messageId" = message.id
        AND hiddenMessage."chatMemberId" = :memberId
    )
    `,
      { memberId },
    );

    return qb;
  }

  applyContentJoin(qb: SelectQueryBuilder<MessageEntity>) {
    qb.leftJoinAndSelect('message.content', 'content');
    return qb;
  }

  applyAttachmentsJoin(qb: SelectQueryBuilder<MessageEntity>) {
    qb.leftJoinAndSelect('message.attachments', 'attachments');
    return qb;
  }

  applySenderJoin(qb: SelectQueryBuilder<MessageEntity>) {
    qb.leftJoinAndSelect('message.senderMember', 'senderMember');
    qb.leftJoinAndSelect('senderMember.profile', 'senderProfile');
    return qb;
  }

  applyReplyJoin(qb: SelectQueryBuilder<MessageEntity>) {
    qb.leftJoinAndSelect('message.replyToMessage', 'replyToMessage');

    qb.leftJoinAndSelect('replyToMessage.content', 'replyContent');

    qb.leftJoinAndSelect('replyToMessage.senderMember', 'replySenderMember');

    qb.leftJoinAndSelect('replySenderMember.profile', 'replySenderProfile');

    return qb;
  }

  applyForwardedFromJoin(qb: SelectQueryBuilder<MessageEntity>) {
    qb.leftJoinAndSelect('message.forwardedFromMessage', 'forwardedMessage');

    qb.leftJoinAndSelect(
      'forwardedMessage.senderMember',
      'forwardedSenderMember',
    );

    qb.leftJoinAndSelect(
      'forwardedSenderMember.profile',
      'forwardedSenderProfile',
    );

    return qb;
  }

  applySearch(qb: SelectQueryBuilder<MessageEntity>, query?: string) {
    if (!query?.trim()) return qb;

    qb.andWhere('content.content ILIKE :query', {
      query: `%${query.trim()}%`,
    });

    return qb;
  }

  async executeIdsQuery(qb: SelectQueryBuilder<MessageEntity>, limit: number) {
    const rows = await qb.limit(limit + 1).getRawMany<{
      message_id: number;
      message_createdAt: string;
    }>();

    const hasNext = rows.length > limit;
    const sliced = hasNext ? rows.slice(0, limit) : rows;
    const ids = sliced.map((r) => r.message_id);

    const lastItem = sliced[sliced.length - 1];
    const nextCursor = hasNext
      ? messageCodec.encode({
          id: lastItem.message_id,
          createdAt: lastItem.message_createdAt,
        })
      : null;

    return { ids, nextCursor };
  }

  async executeDataQuery(qb: SelectQueryBuilder<MessageEntity>, ids: number[]) {
    const data = await qb.getMany();

    const orderMap = new Map(ids.map((id, i) => [id, i]));
    data.sort((a, b) => orderMap.get(a.id)! - orderMap.get(b.id)!);

    return data;
  }

  async countUnreadMessages({
    chatId,
    lastReadMessageId,
  }: {
    chatId: number;
    lastReadMessageId: number | null;
  }) {
    const qb = this.messageRepository.createQueryBuilder('message');

    qb.where('message.chatId = :chatId', { chatId });

    if (lastReadMessageId) {
      qb.andWhere('message.id > :lastReadMessageId', {
        lastReadMessageId,
      });
    }

    return qb.getCount();
  }

  async findRealtimeLastVisibleMessage(chatId: number, chatMemberId: number) {
    const { entities, raw } = await this.messageRepository
      .createQueryBuilder('message')

      .leftJoinAndSelect('message.content', 'content')
      .leftJoinAndSelect('message.senderMember', 'sender')
      .leftJoinAndSelect('sender.profile', 'profile')

      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(*)')
          .from('message_attachments', 'attachment')
          .where('attachment."messageId" = message.id');
      }, 'attachmentsCount')

      .where('message."chatId" = :chatId', { chatId })

      .andWhere('message."deletedAt" IS NULL')

      .andWhere(
        `
      NOT EXISTS (
        SELECT 1
        FROM hidden_messages hm
        WHERE hm."messageId" = message.id
          AND hm."chatMemberId" = :chatMemberId
      )
      `,
        { chatMemberId },
      )

      .andWhere(
        `
      (
        NOT EXISTS (
          SELECT 1
          FROM chat_members member
          WHERE member.id = :chatMemberId
            AND member."leftAt" IS NOT NULL
        )
        OR message."createdAt" <= (
          SELECT member."leftAt"
          FROM chat_members member
          WHERE member.id = :chatMemberId
        )
      )
      `,
        { chatMemberId },
      )

      .orderBy('message."createdAt"', 'DESC')
      .addOrderBy('message.id', 'DESC')

      .limit(1)

      .getRawAndEntities();

    if (!entities.length) {
      return null;
    }

    return {
      message: entities[0],
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      attachmentsCount: Number(raw[0].attachmentsCount),
    };
  }
}
