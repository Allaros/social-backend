import { CreateSystemMessageUseCase } from '@app/modules/messages/use-cases/create-system-message.usecase';
import { ProfileService } from '@app/modules/profile/services/profile.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InitiateGroupChatUseCase {
  constructor(
    private readonly createSystemMessageUseCase: CreateSystemMessageUseCase,
    private readonly profileService: ProfileService,
  ) {}

  async execute({
    initiatorId,
    chatId,
    invitedProfileIds,
  }: {
    initiatorId: number;
    invitedProfileIds: number[];
    chatId: number;
  }) {
    const initiatorProfile = await this.profileService.findById(initiatorId);

    if (!initiatorProfile) {
      throw new Error(
        `Invariant violated: initiator profile ${initiatorId} not found`,
      );
    }

    const initialMessageText = `${initiatorProfile.name} создал группу`;

    await this.createSystemMessageUseCase.execute({
      chatId,
      text: initialMessageText,
    });

    if (invitedProfileIds.length) {
      const invitedProfiles =
        await this.profileService.findMany(invitedProfileIds);

      if (invitedProfiles.length) {
        for (const invitedProfile of invitedProfiles) {
          const inviteMessageText = `${initiatorProfile.name} пригласил ${invitedProfile.name}`;

          await this.createSystemMessageUseCase.execute({
            chatId,
            text: inviteMessageText,
          });
        }
      }
    }
  }
}
