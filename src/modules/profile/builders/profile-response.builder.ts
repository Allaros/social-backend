import { Injectable } from '@nestjs/common';
import { ProfileEntity } from '../profile.entity';
import { ProfileCalculatedFields } from '../types/profile.interface';

@Injectable()
export class ProfileResponseBuilder {
  buildList(
    entities: ProfileEntity[],
    calculatedMap: Map<number, ProfileCalculatedFields>,
  ) {
    return entities.map((profile) => {
      const calculated = calculatedMap.get(profile.id);

      return {
        id: profile.id,
        name: profile.name,
        username: profile.username,
        avatarUrl: profile.avatarUrl,
        bio: profile.bio,

        isOwner: calculated?.isOwner ?? false,

        isFollowed: calculated?.isFollowed ?? false,

        isFollower: calculated?.isFollower ?? false,

        isOnline: calculated?.isOnline ?? false,
      };
    });
  }

  buildSingle(profile: ProfileEntity, statusFields?: ProfileCalculatedFields) {
    return {
      id: profile.id,
      name: profile.name,
      username: profile.username,
      avatarUrl: profile.avatarUrl,
      bio: profile.bio,
      followingCount: profile.followingCount,
      followersCount: profile.followersCount,
      postsCount: profile.postsCount,

      isOwner: statusFields?.isOwner ?? false,
      isFollowed: statusFields?.isFollowed ?? false,
      isFollower: statusFields?.isFollower ?? false,
      isOnline: statusFields?.isOnline ?? false,
    };
  }
}
