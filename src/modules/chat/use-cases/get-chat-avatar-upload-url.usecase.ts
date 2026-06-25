import { StorageService } from '@app/modules/file/services/storage.service';
import { BucketName } from '@app/modules/file/types/file.interface';
import { buildChatAvatarPath } from '@app/modules/file/utils/build-storage-path';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GetChatAvatarUploadUrlUseCase {
  constructor(private readonly storageService: StorageService) {}

  async execute({ mimeType }: { mimeType: string }) {
    const path = buildChatAvatarPath(mimeType);

    return this.storageService.createPresignedUploadUrl(
      BucketName.CHAT_AVATARS,
      path,
    );
  }
}
