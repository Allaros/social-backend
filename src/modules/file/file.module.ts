import { Module } from '@nestjs/common';
import { StorageService } from './services/storage.service';
import { ImageService } from './services/image.service';
import { DeleteMediaUseCase } from './use-cases/delete-media.usecase';
import { UploadMediaUseCase } from './use-cases/upload-media.usecase';

@Module({
  providers: [
    StorageService,
    ImageService,
    DeleteMediaUseCase,
    UploadMediaUseCase,
  ],
  exports: [
    DeleteMediaUseCase,
    UploadMediaUseCase,
    StorageService,
    ImageService,
  ],
})
export class FileModule {}
