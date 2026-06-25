import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatMemberEntity } from '../entities/chat-member.entity';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ChatMembersCursor } from '../use-cases/get-participants.usecase';
import { CompositeCursorQueryHelper } from '@app/shared/cursor/helpers/composite-cursor-qb';

@Injectable()
export class ChatMemberQueryService {
  constructor(
    @InjectRepository(ChatMemberEntity)
    private readonly chatMemberRepository: Repository<ChatMemberEntity>,
  ) {}

  buildBaseQuery() {
    return this.chatMemberRepository.createQueryBuilder('member');
  }

  buildChatMembersQuery(chatId: number) {
    return this.chatMemberRepository
      .createQueryBuilder('member')
      .innerJoinAndSelect('member.profile', 'profile')
      .where('member.chatId = :chatId', { chatId });
  }

  applyExcludeCurrentProfile(
    qb: SelectQueryBuilder<ChatMemberEntity>,
    profileId: number,
  ) {
    qb.andWhere('member.profileId != :profileId', { profileId });

    return qb;
  }

  applySorting(qb: SelectQueryBuilder<ChatMemberEntity>) {
    qb.orderBy('profile.name', 'ASC');
    qb.addOrderBy('member.id', 'ASC');

    return qb;
  }

  applyCursor(
    qb: SelectQueryBuilder<ChatMemberEntity>,
    cursor: ChatMembersCursor | null,
  ) {
    return CompositeCursorQueryHelper.applyCompositeCursor(qb, cursor, {
      order: 'ASC',
      fields: [
        {
          key: 'name',
          column: 'profile.name',
        },
        {
          key: 'memberId',
          column: 'member.id',
        },
      ],
    });
  }
}
