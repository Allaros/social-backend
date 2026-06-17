import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageEntity } from '../entities/messages.entity';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CursorCodec } from '@app/shared/cursor/codec/cursor-codec';
import { CompositeCursorConfig } from '@app/shared/cursor/types/cursor.interface';
import { CompositeCursorQueryHelper } from '@app/shared/cursor/helpers/composite-cursor-qb';

type MessageCursor = {
  id: number;
  createdAt: number;
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
          createdAt: new Date(lastItem.message_createdAt).getTime(),
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
}
