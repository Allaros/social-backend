import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageEntity } from './entities/messages.entity';
import { MessageContentEntity } from './entities/messages-content.entity';
import { MessageAttachmentEntity } from './entities/messages-attachment.entity';
import { ChatModule } from '../chat/chat.module';
import { FileModule } from '../file/file.module';
import { MessagesController } from './controllers/messages.controller';
import { MessagesService } from './services/messages.service';
import { MessagesContentService } from './services/messages-content.service';
import { MessagesAttachmentService } from './services/messages-attachment.service';
import { MessagesQueryService } from './services/messages-query.service';
import { MessageCreationService } from './application/message-creation.service';
import { MessageAttachmentValidator } from './validators/attachment.validator';
import { CreateMessageUseCase } from './use-cases/create-message.usecase';
import { GetMessagesUseCase } from './use-cases/get-messages.usecase';
import { GetAttachmentUploadUrlUseCase } from './use-cases/get-attachment-upload-url.usecase';
import { MessageResponseBuilder } from './builders/messages-response.builder';
import { DeleteMessagesUseCase } from './use-cases/delete-messages.usecase';
import { HideMessagesUseCase } from './use-cases/hide-messages.usecase';
import { HideMessagesService } from './services/hide-messages.service';
import { HiddenMessageEntity } from './entities/hidden-message.entity';
import { EditMessageUseCase } from './use-cases/edit-message.usecase';
import { ForwardMessagesUseCase } from './use-cases/forward-messages.usecase';
import { CleanupMessagesUseCase } from './use-cases/cleanup-messages.usecase';
import { AttachmentCleanupService } from './application/attachments-cleanup.service';
import { CreateSystemMessageUseCase } from './use-cases/create-system-message.usecase';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MessageEntity,
      MessageContentEntity,
      MessageAttachmentEntity,
      HiddenMessageEntity,
    ]),
    ChatModule,
    FileModule,
  ],
  controllers: [MessagesController],
  providers: [
    MessagesService,
    MessagesContentService,
    MessagesAttachmentService,
    MessagesQueryService,
    MessageCreationService,
    MessageAttachmentValidator,
    CreateMessageUseCase,
    GetMessagesUseCase,
    GetAttachmentUploadUrlUseCase,
    MessageResponseBuilder,
    DeleteMessagesUseCase,
    HideMessagesUseCase,
    HideMessagesService,
    EditMessageUseCase,
    ForwardMessagesUseCase,
    CleanupMessagesUseCase,
    AttachmentCleanupService,
    CreateSystemMessageUseCase,
  ],
  exports: [
    MessagesService,
    CleanupMessagesUseCase,
    CreateSystemMessageUseCase,
  ],
})
export class MessagesModule {}
