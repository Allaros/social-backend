import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MessageAttachmentDto } from '../types/messages-attachment.dto';
import { ChatPermissionService } from '@app/modules/chat/services/chat-permission.service';
import { MessagesService } from '../services/messages.service';
import { MessageAttachmentValidator } from '../validators/attachment.validator';
import { MessageCreationService } from '../application/message-creation.service';
import { ResolveChatByIdentifierUseCase } from '@app/modules/chat/use-cases/resolve-chat-by-identifier.usecase';
import { MessageResponseBuilder } from '../builders/messages-response.builder';
import EventEmitter2 from 'eventemitter2';
import { MessagesEvents } from '@app/shared/events/domain-events';
import { MessageCreatedEvent } from '../events/message-created.event';
import { ChatMemberService } from '@app/modules/chat/services/chat-member.service';
import { MessagesQueryService } from '../services/messages-query.service';

@Injectable()
export class CreateMessageUseCase {
  constructor(
    private readonly chatPermissionService: ChatPermissionService,
    private readonly messagesService: MessagesService,
    private readonly messagesQueryService: MessagesQueryService,
    private readonly attachmentValidator: MessageAttachmentValidator,
    private readonly messageCreationService: MessageCreationService,
    private readonly resolveChatByIdentifier: ResolveChatByIdentifierUseCase,
    private readonly messageResponseBuilder: MessageResponseBuilder,
    private readonly chatMemberService: ChatMemberService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute({
    attachments,
    chatIdentifier,
    currentProfileId,
    replyToMessageId,
    text,
    clientId,
  }: {
    currentProfileId: number;

    chatIdentifier: string;

    text?: string;

    replyToMessageId?: number;

    attachments?: MessageAttachmentDto[];
    clientId: string;
  }) {
    const chat = await this.resolveChatByIdentifier.execute({
      identifier: chatIdentifier,
      currentProfileId,
    });

    const chatId = chat.id;

    const currentMember = await this.chatPermissionService.ensureMember({
      chatId,
      profileId: currentProfileId,
    });

    this.chatPermissionService.ensureCanSendMessages(currentMember);

    const normalizedText = text?.trim() || null;

    const normalizedAttachments = attachments ?? [];

    if (!normalizedText && normalizedAttachments.length === 0) {
      throw new BadRequestException('Сообщение не может быть пустым');
    }

    const replyMessage = await this.validateReplyMessage(
      chatId,
      replyToMessageId,
    );

    this.attachmentValidator.validate(attachments);

    const message = await this.messageCreationService.createMessage({
      attachments: !normalizedAttachments.length
        ? undefined
        : normalizedAttachments,
      chatId,
      senderMemberId: currentMember.id,
      text: normalizedText,
      replyToMessageId: replyMessage?.id,
      clientId,
    });

    const members = await this.chatMemberService.getActiveMembers(chatId);

    const receiverMemberIds = members
      .filter((member) => member.id !== currentMember.id)
      .map((member) => member.id);

    this.eventEmitter.emit(
      MessagesEvents.MESSAGE_CREATED,
      new MessageCreatedEvent({
        messageId: message.id,
        receiverMemberIds,
        actorId: currentProfileId,
      }),
    );

    const fullMessage = await this.messagesQueryService.findRealtimeMessage(
      message.id,
    );

    const result = await this.messageResponseBuilder.buildMessages(
      [fullMessage!],
      currentProfileId,
      null,
    );

    return result[0];
  }

  private async validateReplyMessage(
    chatId: number,
    replyToMessageId?: number,
  ) {
    if (!replyToMessageId) return null;

    const replyMessage = await this.messagesService.ensureMessageBelongsToChat(
      chatId,
      replyToMessageId,
    );

    if (!replyMessage)
      throw new NotFoundException('Не удалось найти сообщение для ответа');

    return replyMessage;
  }
}
