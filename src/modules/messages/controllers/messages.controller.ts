import { UserEntity } from '@app/modules/user/user.entity';
import { CurrentUser } from '@app/shared/decorators/currentUser.decorator';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { CreateMessageDto, GetMessagesDto } from '../types/messages.dto';
import { CreateMessageUseCase } from '../use-cases/create-message.usecase';

import { JwtAuthGuard } from '@app/modules/auth/guards/auth.guard';
import { EmailVerifiedGuard } from '@app/modules/auth/guards/email-verified.guard';
import { GetAttachmentUploadUrlUseCase } from '../use-cases/get-attachment-upload-url.usecase';
import { GetAttachmentUploadUrlDto } from '../types/messages-attachment.dto';
import { GetMessagesUseCase } from '../use-cases/get-messages.usecase';

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
    });
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
}
