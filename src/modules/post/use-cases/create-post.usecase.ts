import { UploadedMedia } from '@app/modules/file/types/file.interface';
import {
  Injectable,
  BadRequestException,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PostService } from '../services/post.service';
import { CreatePostBody } from '../types/post.interface';
import { ProfileService } from '@app/modules/profile/profile.service';
import { PostMediaService } from '@app/modules/post-media/services/post-media.service';
import { UploadMediaUseCase } from '@app/modules/file/use-cases/upload-media.usecase';
import { DeleteMediaUseCase } from '@app/modules/file/use-cases/delete-media.usecase';
import { processContent } from '../helpers/process-content';

@Injectable()
export class CreatePostUseCase {
  constructor(
    private readonly postService: PostService,
    private readonly mediaService: PostMediaService,
    private readonly profileService: ProfileService,
    private readonly uploadMediaUseCase: UploadMediaUseCase,
    private readonly deleteMediaUseCase: DeleteMediaUseCase,
    private readonly dataSource: DataSource,
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

      const post = await this.dataSource.transaction(async (manager) => {
        const createdPost = await this.postService.create(
          {
            profileId,
            content: safeContent,
            visibility: dto.visibility ?? 'public',
            allowComments: dto.allowComments ?? true,
          },
          manager,
        );

        if (uploadedMedia.length) {
          await this.mediaService.attachToPost(
            uploadedMedia,
            createdPost.id,
            manager,
          );
        }

        await this.profileService.incrementPostsCount(profileId, manager);

        return createdPost;
      });

      return post;
    } catch (error) {
      if (uploadedMedia.length) {
        await this.deleteMediaUseCase.execute(uploadedMedia, 'post-media');
      }

      if (error instanceof HttpException) throw error;

      throw new InternalServerErrorException('Не удалось создать пост');
    }
  }
}
