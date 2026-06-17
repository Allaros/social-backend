import { UserEntity } from '@app/modules/user/user.entity';
import { CurrentUser } from '@app/shared/decorators/currentUser.decorator';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import {
  CreateMessageDto,
  EditMessageDto,
  ForwardMessagesDto,
  GetMessagesDto,
  MessagesActionDto,
} from '../types/messages.dto';
import { CreateMessageUseCase } from '../use-cases/create-message.usecase';

import { JwtAuthGuard } from '@app/modules/auth/guards/auth.guard';
import { EmailVerifiedGuard } from '@app/modules/auth/guards/email-verified.guard';
import { GetAttachmentUploadUrlUseCase } from '../use-cases/get-attachment-upload-url.usecase';
import { GetAttachmentUploadUrlDto } from '../types/messages-attachment.dto';
import { GetMessagesUseCase } from '../use-cases/get-messages.usecase';
import { DeleteMessagesUseCase } from '../use-cases/delete-messages.usecase';
import { HideMessagesUseCase } from '../use-cases/hide-messages.usecase';
import { EditMessageUseCase } from '../use-cases/edit-message.usecase';
import { ForwardMessagesUseCase } from '../use-cases/forward-messages.usecase';

@Controller('chats')
@UseGuards(JwtAuthGuard, EmailVerifiedGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class MessagesController {
  constructor(
    private readonly createMessageUseCase: CreateMessageUseCase,
    private readonly getAttachmentUploadUrlUseCase: GetAttachmentUploadUrlUseCase,
    private readonly getMessagesUseCase: GetMessagesUseCase,
    private readonly deleteMessagesUseCase: DeleteMessagesUseCase,
    private readonly hideMessagesUseCase: HideMessagesUseCase,
    private readonly editMessageUseCase: EditMessageUseCase,
    private readonly forwardMessageUseCase: ForwardMessagesUseCase,
  ) {}

  @Get(':chatIdentifier/messages')
  getMessages(
    @CurrentUser() user: UserEntity,
    @Param('chatIdentifier') chatIdentifier: string,
    @Query() query: GetMessagesDto,
  ) {
    return this.getMessagesUseCase.execute({
      chatIdentifier,
      currentProfileId: user.profile.id,
      limit: query.limit,
      cursor: query.cursor,
      query: query.query,
    });
  }

  @Post(':chatIdentifier/messages')
  createMessage(
    @CurrentUser() user: UserEntity,

    @Param('chatIdentifier')
    chatIdentifier: string,

    @Body()
    body: CreateMessageDto,
  ) {
    return this.createMessageUseCase.execute({
      currentProfileId: user.profile.id,

      chatIdentifier,

      text: body.text,

      replyToMessageId: body.replyToMessageId,

      attachments: body.attachments,
      clientId: body.clientId,
    });
  }

  @Post(':chatIdentifier/messages/delete')
  async deleteMessages(
    @Param('chatIdentifier') chatIdentifier: string,
    @Body() dto: MessagesActionDto,
    @CurrentUser() user: UserEntity,
  ) {
    await this.deleteMessagesUseCase.execute({
      chatIdentifier,
      currentProfileId: user.profile.id,
      messageIds: dto.messageIds,
    });

    return { success: true };
  }

  @Post(':chatIdentifier/messages/hide')
  async hideMessages(
    @Param('chatIdentifier') chatIdentifier: string,
    @Body() dto: MessagesActionDto,
    @CurrentUser() user: UserEntity,
  ) {
    await this.hideMessagesUseCase.execute({
      chatIdentifier,
      currentProfileId: user.profile.id,
      messageIds: dto.messageIds,
    });

    return { success: true };
  }

  @Post(':chatIdentifier/attachments/upload-url')
  getAttachmentUploadUrl(
    @CurrentUser() user: UserEntity,
    @Param('chatIdentifier') chatIdentifier: string,
    @Body() body: GetAttachmentUploadUrlDto,
  ) {
    return this.getAttachmentUploadUrlUseCase.execute({
      currentProfileId: user.profile.id,
      chatIdentifier,
      mimeType: body.mimeType,
    });
  }

  @Put(':chatIdentifier/messages/:messageId')
  async editMessage(
    @Param('chatIdentifier') chatIdentifier: string,
    @Param('messageId', ParseIntPipe) messageId: number,
    @Body() body: EditMessageDto,
    @CurrentUser() user: UserEntity,
  ) {
    await this.editMessageUseCase.execute({
      chatIdentifier,
      currentProfileId: user.profile.id,
      messageId,
      newText: body.text,
    });

    return { success: true };
  }

  @Post(':chatIdentifier/messages/forward')
  async forwardMessages(
    @Param('chatIdentifier') chatIdentifier: string,
    @Body() dto: ForwardMessagesDto,
    @CurrentUser() user: UserEntity,
  ) {
    return await this.forwardMessageUseCase.execute({
      chatIdentifier,
      currentProfileId: user.profile.id,
      forwardPayload: dto.forwardPayload,
    });
  }
}
