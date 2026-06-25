import { Injectable } from '@nestjs/common';
import { ChatMemberEntity } from '../entities/chat-member.entity';
import { ProfileEntity } from '@app/modules/profile/entities/profile.entity';
import { MemberChatStatusEnum } from '../use-cases/get-members-to-add.usecase';

@Injectable()
export class ChatMemberResponseBuilder {
  build(
    member: ChatMemberEntity,
    onlineMap: Map<number, boolean>,
    initiatorId?: number,
  ) {
    return {
      memberId: member.id,
      memberProfileId: member.profile.id,
      name: member.profile.name,
      username: member.profile.username,
      avatarUrl: member.profile.avatarUrl,
      role: member.role,
      isOnline: onlineMap.get(member.profileId) ?? false,
      lastSeenAt: member.profile.lastSeenAt,
      isSelf: member.profile.id === initiatorId,
      leftAt: member.leftAt,
      restrictedUntil: member.restrictedUntil,
    };
  }

  buildMany(
    members: ChatMemberEntity[],
    onlineMap: Map<number, boolean>,
    initiatorId?: number,
  ) {
    return members.map((member) => this.build(member, onlineMap, initiatorId));
  }

  buildCandidate(
    profile: ProfileEntity,
    options: {
      isOnline: boolean;
      chatStatus: MemberChatStatusEnum;
    },
  ) {
    return {
      profileId: profile.id,
      name: profile.name,
      username: profile.username,
      avatarUrl: profile.avatarUrl,
      isOnline: options.isOnline,
      lastSeenAt: profile.lastSeenAt,
      chatStatus: options.chatStatus,
    };
  }

  buildCandidates(
    profiles: ProfileEntity[],
    calculatedMap: Map<
      number,
      {
        isOnline: boolean;
        chatStatus: MemberChatStatusEnum;
      }
    >,
  ) {
    return profiles.map((profile) =>
      this.buildCandidate(profile, calculatedMap.get(profile.id)!),
    );
  }
}
