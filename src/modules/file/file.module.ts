import { forwardRef, Module } from '@nestjs/common';
import { StorageService } from './services/storage.service';
import { ImageService } from './services/image.service';
import { DeleteMediaUseCase } from './use-cases/delete-media.usecase';
import { UploadMediaUseCase } from './use-cases/upload-media.usecase';
import { ReplaceAvatarUseCase } from './use-cases/replace-avatar.usecase';
import { ProfileModule } from '../profile/profile.module';

@Module({
  imports: [forwardRef(() => ProfileModule)],
  providers: [
    StorageService,
    ImageService,
    DeleteMediaUseCase,
    UploadMediaUseCase,
    ReplaceAvatarUseCase,
  ],
  exports: [DeleteMediaUseCase, UploadMediaUseCase, ReplaceAvatarUseCase],
})
export class FileModule {}
