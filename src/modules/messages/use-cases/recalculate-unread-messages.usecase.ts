import { Injectable, Logger } from '@nestjs/common';
import { MessagesQueryService } from '@app/modules/messages/services/messages-query.service';
import { ChatMemberService } from '@app/modules/chat/services/chat-member.service';
import { ChatUnreadStateChangedEvent } from '@app/modules/chat/events/chat-unread-state-changed.event';
import { ChatEvents } from '@app/shared/events/domain-events';
import EventEmitter2 from 'eventemitter2';

@Injectable()
export class RecalculateUnreadMessagesUseCase {
  constructor(
    private readonly chatMemberService: ChatMemberService,
    private readonly messagesQueryService: MessagesQueryService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private readonly logger = new Logger(RecalculateUnreadMessagesUseCase.name);

  private readonly pendingIncrements = new Map<number, number>();

  private flushTimer: NodeJS.Timeout | null = null;

  async execute(memberId: number) {
    const member = await this.chatMemberService.findById(memberId);

    if (!member) {
      return;
    }

    const unreadCount = await this.messagesQueryService.countUnreadMessages({
      chatId: member.chatId,
      lastReadMessageId: member.lastReadMessageId,
    });

    await this.chatMemberService.setUnreadCount(memberId, unreadCount);

    return unreadCount;
  }

  async executeForMembers(memberIds: number[]) {
    await Promise.all(memberIds.map((memberId) => this.execute(memberId)));
  }

  async executeForChat(chatId: number) {
    const members = await this.chatMemberService.getActiveMembers(chatId);

    await Promise.all(members.map((member) => this.execute(member.id)));
  }

  async decrementForDeletedMessages(
    memberIds: number[],
    deletedMessageIds: number[],
  ) {
    this.logger.log('Decrement for deleted messages ititiated');
    const decrements =
      await this.chatMemberService.countDeletedUnreadMessagesForMembers({
        memberIds,
        deletedMessageIds,
      });

    if (!decrements.size) {
      return;
    }

    const result = await this.chatMemberService.changeUnreadCountBatch(
      Array.from(decrements.entries()).map(([memberId, decrement]) => ({
        memberId,
        delta: -decrement,
      })),
    );

    for (const member of result) {
      if (!member.becameRead) {
        continue;
      }

      this.eventEmitter.emit(
        ChatEvents.CHAT_UNREAD_STATE_CHANGED,
        new ChatUnreadStateChangedEvent({
          profileId: member.profileId,
          unreadChatsCountDelta: member.muted ? 0 : -1,
          unreadMutedChatsCountDelta: member.muted ? -1 : 0,
        }),
      );
    }
  }

  incrementForCreatedMessages(memberIds: number[]) {
    for (const memberId of memberIds) {
      this.pendingIncrements.set(
        memberId,
        (this.pendingIncrements.get(memberId) ?? 0) + 1,
      );
    }

    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => {
        void this.flushIncrements();
      }, 1000);
    }
  }

  private async flushIncrements() {
    this.logger.log('Increment for created messages ititiated');
    this.flushTimer = null;

    if (!this.pendingIncrements.size) {
      return;
    }

    const increments = Array.from(this.pendingIncrements.entries()).map(
      ([memberId, delta]) => ({
        memberId,
        delta,
      }),
    );

    this.pendingIncrements.clear();

    try {
      const result =
        await this.chatMemberService.changeUnreadCountBatch(increments);

      for (const member of result) {
        if (!member.becameUnread) {
          continue;
        }

        this.eventEmitter.emit(
          ChatEvents.CHAT_UNREAD_STATE_CHANGED,
          new ChatUnreadStateChangedEvent({
            profileId: member.profileId,
            unreadChatsCountDelta: member.muted ? 0 : 1,
            unreadMutedChatsCountDelta: member.muted ? 1 : 0,
          }),
        );
      }
    } catch (e) {
      for (const { memberId, delta } of increments) {
        this.pendingIncrements.set(
          memberId,
          (this.pendingIncrements.get(memberId) ?? 0) + delta,
        );
      }

      throw e;
    }
  }

  async decrementForReadMessages(memberId: number, count: number) {
    this.logger.log('Decrement for read messages ititiated');
    const [result] = await this.chatMemberService.changeUnreadCountBatch([
      {
        memberId,
        delta: -count,
      },
    ]);

    if (!result?.becameRead) {
      return;
    }

    this.eventEmitter.emit(
      ChatEvents.CHAT_UNREAD_STATE_CHANGED,
      new ChatUnreadStateChangedEvent({
        profileId: result.profileId,
        unreadChatsCountDelta: result.muted ? 0 : -1,
        unreadMutedChatsCountDelta: result.muted ? -1 : 0,
      }),
    );
  }

  async simpleIncrementForCreatedMessages(memberIds: number[]) {
    this.logger.log('Increment for created messages ititiated');
    const results = await this.chatMemberService.changeUnreadCountBatch(
      memberIds.map((memberId) => ({
        memberId,
        delta: 1,
      })),
    );

    for (const result of results) {
      if (!result.becameUnread) {
        continue;
      }

      this.eventEmitter.emit(
        ChatEvents.CHAT_UNREAD_STATE_CHANGED,
        new ChatUnreadStateChangedEvent({
          profileId: result.profileId,
          unreadChatsCountDelta: result.muted ? 0 : 1,
          unreadMutedChatsCountDelta: result.muted ? 1 : 0,
        }),
      );
    }
  }
}
