import { ProfileService } from '@app/modules/profile/services/profile.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatParticipantsValidator {
  constructor(private readonly profileService: ProfileService) {}

  async validateProfilesExist(profileIds: number[]) {
    const uniqueIds = [...new Set(profileIds)];

    const existingProfiles = await this.profileService.findMany(uniqueIds);

    const existingIds = new Set(existingProfiles.map((p) => p.id));

    const missingIds = uniqueIds.filter((id) => !existingIds.has(id));

    return {
      existingProfiles,
      missingIds,
    };
  }
}
