import { Injectable } from '@nestjs/common';
import { ProfileQueryService } from '../services/profile-query.service';
import { ProfileRawRow } from '../types/profile.interface';
import { ProfileResponseBuilder } from '../builders/profile-response.builder';
import { PresenceStateService } from '@app/modules/websocket/services/presence-state.service';

@Injectable()
export class GetProfileByUsernameUseCase {
  constructor(
    private readonly profileQueryService: ProfileQueryService,
    private readonly profileResponseBuilder: ProfileResponseBuilder,
    private readonly presenceStateService: PresenceStateService,
  ) {}

  async execute(username: string, viewerId: number) {
    const { entities, raw } = await this.profileQueryService.findByUsername(
      username,
      viewerId,
    );

    const entity = entities[0];

    if (!entity) {
      return null;
    }

    const typedRaw = raw as ProfileRawRow[];

    const rawMap = new Map(typedRaw.map((r) => [r.profile_id, r]));

    const row = rawMap.get(entity.id);

    const isOnline = await this.presenceStateService.isOnline(entity.id);

    return this.profileResponseBuilder.buildSingle(entity, {
      isOwner: row?.is_owner ?? false,
      isFollowed: row?.is_followed ?? false,
      isFollower: row?.is_follower ?? false,
      isOnline,
    });
  }
}
