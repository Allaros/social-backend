import { Injectable } from '@nestjs/common';
import { ChatPermissionService } from '../../chat/services/chat-permission.service';
import { StorageService } from '@app/modules/file/services/storage.service';
import { buildAttachmentPath } from '@app/modules/file/utils/build-storage-path';
import { BucketName } from '@app/modules/file/types/file.interface';
import { ResolveChatByIdentifierUseCase } from '@app/modules/chat/use-cases/resolve-chat-by-identifier.usecase';

@Injectable()
export class GetAttachmentUploadUrlUseCase {
  constructor(
    private readonly chatPermissionService: ChatPermissionService,
    private readonly storageService: StorageService,
    private readonly resolveChatByIdentifier: ResolveChatByIdentifierUseCase,
  ) {}

  async execute({
    currentProfileId,
    chatIdentifier,
    mimeType,
  }: {
    currentProfileId: number;
    chatIdentifier: string;
    mimeType: string;
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

    const path = buildAttachmentPath(chatId, mimeType);

    return this.storageService.createPresignedUploadUrl(
      BucketName.MESSAGE_ATTACHMENTS,
      path,
    );
  }
}
