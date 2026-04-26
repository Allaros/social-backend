import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { EditPostDto } from '../types/post.dto';
import { PostService } from '../services/post.service';
import { UploadedMedia } from '@app/modules/file/types/file.interface';
import { processContent } from '../helpers/process-content';
import { DeleteMediaUseCase } from '@app/modules/file/use-cases/delete-media.usecase';
import { UploadMediaUseCase } from '@app/modules/file/use-cases/upload-media.usecase';
import { PostMediaService } from '@app/modules/post-media/services/post-media.service';
import { DataSource } from 'typeorm';

@Injectable()
export class EditPostUseCase {
  constructor(
    private readonly postService: PostService,
    private readonly deleteMediaUseCase: DeleteMediaUseCase,
    private readonly uploadMediaUseCase: UploadMediaUseCase,
    private readonly mediaService: PostMediaService,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    postId: number,
    currentProfileId: number,
    dto: EditPostDto,
    media?: Express.Multer.File[],
  ) {
    let uploadedMedia: UploadedMedia[] = [];

    const existingPost = await this.postService.findByIdWithDeleted(postId);

    if (!existingPost)
      throw new NotFoundException('Не удается найти данный пост');

    if (existingPost.profileId !== currentProfileId)
      throw new ForbiddenException(
        'У вас нет прав для изменения данного поста',
      );

    const hasExistingMedia =
      existingPost.media.length > 0 &&
      (!dto.keepMediaIds || dto.keepMediaIds.length > 0);

    if (!dto.content && !hasExistingMedia && (!media || media.length === 0)) {
      throw new BadRequestException('Нельзя создать пустой пост');
    }

    const safeContent = processContent(dto.content);

    try {
      if (media?.length) {
        uploadedMedia = await this.uploadMediaUseCase.execute(
          media,
          currentProfileId,
          'post-media',
        );
      }

      const post = await this.dataSource.transaction(async (manager) => {
        const updatedPost = await this.postService.update(
          postId,
          {
            content: safeContent,
            visibility: dto.visibility,
            allowComments: dto.allowComments,
            isEdited: true,
          },
          manager,
        );

        if (dto.keepMediaIds) {
          const toDelete = existingPost.media.filter(
            (m) => !dto.keepMediaIds?.includes(m.id),
          );

          if (toDelete.length) {
            await this.mediaService.deleteMany(
              toDelete.map((m) => m.id),
              manager,
            );

            await this.deleteMediaUseCase.execute(
              toDelete.map((m) => ({
                url: m.url,
                type: m.type,
              })),
              'post-media',
            );
          }
        }

        if (uploadedMedia.length) {
          await this.mediaService.attachToPost(uploadedMedia, postId, manager);
        }

        return updatedPost;
      });

      return post;
    } catch (error) {
      if (uploadedMedia.length) {
        await this.deleteMediaUseCase.execute(uploadedMedia, 'post-media');
      }

      if (error instanceof HttpException) throw error;

      throw new InternalServerErrorException('Не удалось отредактировать пост');
    }
  }
}
