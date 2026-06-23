import { Injectable } from '@nestjs/common';
import { ChatMemberService } from '../services/chat-member.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class ChatRestrictionSchedulerService {
  constructor(private readonly chatMemberService: ChatMemberService) {}

  @Cron('* * * * *')
  async clearExpiredRestrictions() {
    await this.chatMemberService.clearExpiredRestrictions();
  }
}
