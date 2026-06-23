import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatMemberEntity } from '../entities/chat-member.entity';
import { EntityManager, Repository } from 'typeorm';
import { ChatMemberRoleEnum } from '../types/chat-member.interface';

@Injectable()
export class ChatPermissionService {
  constructor(
    @InjectRepository(ChatMemberEntity)
    private readonly chatMemberRepository: Repository<ChatMemberEntity>,
  ) {}

  private getRepo(manager?: EntityManager) {
    return manager
      ? manager.getRepository(ChatMemberEntity)
      : this.chatMemberRepository;
  }

  async getMember({
    chatId,
    profileId,
    manager,
  }: {
    chatId: number;
    profileId: number;
    manager?: EntityManager;
  }) {
    const repo = this.getRepo(manager);

    return repo.findOne({
      where: {
        chatId,
        profileId,
      },
    });
  }

  async ensureMember({
    chatId,
    profileId,
    manager,
  }: {
    chatId: number;
    profileId: number;
    manager?: EntityManager;
  }) {
    const member = await this.getMember({
      chatId,
      profileId,
      manager,
    });

    if (!member || member.restrictedUntil) {
      throw new ForbiddenException('Вы не являетесь участником чата');
    }

    return member;
  }

  ensureOwner(member: ChatMemberEntity) {
    if (member.role !== ChatMemberRoleEnum.OWNER) {
      throw new ForbiddenException('Недостаточно прав');
    }

    return member;
  }

  ensureCanManageChat(member: ChatMemberEntity) {
    if (
      member.role !== ChatMemberRoleEnum.OWNER &&
      member.role !== ChatMemberRoleEnum.ADMIN
    ) {
      throw new ForbiddenException('Недостаточно прав для управления чатом');
    }

    return member;
  }

  ensureCanSendMessages(member: ChatMemberEntity) {
    if (member.leftAt) {
      throw new ForbiddenException('Вы покинули чат');
    }

    if (member.restrictedUntil && member.restrictedUntil > new Date()) {
      throw new ForbiddenException('Отправка сообщений временно ограничена');
    }

    return member;
  }
}
