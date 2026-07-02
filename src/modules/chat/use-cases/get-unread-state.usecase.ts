import { Injectable } from '@nestjs/common';
import { ChatMemberService } from '../services/chat-member.service';

@Injectable()
export class GetUnreadStateUseCase {
  constructor(private readonly chatMemberService: ChatMemberService) {}

  async execute(currentProfileId: number) {
    return await this.chatMemberService.getUnreadStateForProfile(
      currentProfileId,
    );
  }
}
