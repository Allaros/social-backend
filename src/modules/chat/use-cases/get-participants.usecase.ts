import { Injectable } from '@nestjs/common';
import { ResolveChatByIdentifierUseCase } from './resolve-chat-by-identifier.usecase';
import { ChatPermissionService } from '../services/chat-permission.service';
import { CursorCodec } from '@app/shared/cursor/codec/cursor-codec';
import { PaginationExecutor } from '@app/shared/cursor/helpers/pagination-executor';
import { ChatMemberQueryService } from '../services/chat-member-query.service';
import { ChatMemberResponseBuilder } from '../builders/chat-member-response.builder';
import { PresenceStateService } from '@app/modules/websocket/services/presence-state.service';

export type ChatMembersCursor = {
  name: string;
  memberId: number;
};
const membersCursorCodec = new CursorCodec<ChatMembersCursor>([
  'name',
  'memberId',
]);
@Injectable()
export class GetParticipantsUseCase {
  constructor(
    private readonly resolveChatByIdentifierUseCase: ResolveChatByIdentifierUseCase,
    private readonly chatPermissionService: ChatPermissionService,
    private readonly chatMemberQueryService: ChatMemberQueryService,
    private readonly chatMemberResponseBuilder: ChatMemberResponseBuilder,
    private readonly presenceStateService: PresenceStateService,
  ) {}

  async execute({
    chatIdentifier,
    currentProfileId,
    cursor,
    limit,
  }: {
    chatIdentifier: string;
    currentProfileId: number;
    cursor?: string;
    limit: number;
  }) {
    const chat = await this.resolveChatByIdentifierUseCase.execute({
      currentProfileId,
      identifier: chatIdentifier,
    });

    await this.chatPermissionService.ensureMember({
      chatId: chat.id,
      profileId: currentProfileId,
    });

    const decodedCursor = cursor ? membersCursorCodec.decode(cursor) : null;

    const qb = this.chatMemberQueryService.buildChatMembersQuery(chat.id);

    this.chatMemberQueryService.applyCursor(qb, decodedCursor);

    this.chatMemberQueryService.applySorting(qb);

    const result = await PaginationExecutor.paginate(
      qb,
      limit,
      {
        order: 'ASC',
        fields: ['name', 'memberId'],
      },
      (member) => ({
        name: member.profile.name,
        memberId: member.id,
      }),
      membersCursorCodec,
    );

    const profileIds = result.data.map((member) => member.profileId);

    const onlineMap =
      await this.presenceStateService.getOnlineStatuses(profileIds);

    return {
      data: this.chatMemberResponseBuilder.buildMany(
        result.data,
        onlineMap,
        currentProfileId,
      ),
      nextCursor: result.nextCursor,
    };
  }
}
