import { UploadedMedia } from '@app/modules/file/types/file.interface';
import {
  Injectable,
  BadRequestException,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PostService } from '../services/post.service';
import { CreatePostBody } from '../types/post.interface';
import { PostMediaService } from '@app/modules/post-media/services/post-media.service';
import { UploadMediaUseCase } from '@app/modules/file/use-cases/upload-media.usecase';
import { DeleteMediaUseCase } from '@app/modules/file/use-cases/delete-media.usecase';
import { processContent } from '../helpers/process-content';
import EventEmitter2 from 'eventemitter2';
import { PostEvents } from '@app/shared/events/domain-events';
import { PostCreatedEvent } from '../events/post-create.event';

@Injectable()
export class CreatePostUseCase {
  constructor(
    private readonly postService: PostService,
    private readonly mediaService: PostMediaService,
    private readonly uploadMediaUseCase: UploadMediaUseCase,
    private readonly deleteMediaUseCase: DeleteMediaUseCase,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    profileId: number,
    dto: CreatePostBody,
    files?: Express.Multer.File[],
  ) {
    let uploadedMedia: UploadedMedia[] = [];

    if (!dto.content && (!files || files.length === 0)) {
      throw new BadRequestException('Нельзя создать пустой пост');
    }

    const safeContent = processContent(dto.content);

    try {
      if (files?.length) {
        uploadedMedia = await this.uploadMediaUseCase.execute(
          files,
          profileId,
          'post-media',
        );
      }

      const createdPost = await this.postService.create({
        profileId,
        content: safeContent,
        visibility: dto.visibility ?? 'public',
        allowComments: dto.allowComments ?? true,
      });

      if (uploadedMedia.length) {
        await this.mediaService.attachToPost(uploadedMedia, createdPost.id);
      }

      this.eventEmitter.emit(
        PostEvents.POST_CREATED,
        new PostCreatedEvent(createdPost.id, profileId),
      );

      return createdPost;
    } catch (error) {
      if (uploadedMedia.length) {
        await this.deleteMediaUseCase.execute(uploadedMedia, 'post-media');
      }

      if (error instanceof HttpException) throw error;

      throw new InternalServerErrorException('Не удалось создать пост');
    }
  }
}
