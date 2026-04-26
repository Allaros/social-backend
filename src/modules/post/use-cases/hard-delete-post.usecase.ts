import { ProfileEntity } from '@app/modules/profile/profile.entity';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PostService } from '../services/post.service';
import { DeleteMediaUseCase } from '@app/modules/file/use-cases/delete-media.usecase';
import { LikeService } from '@app/modules/like/services/like.service';
import { LikeTargetType } from '@app/modules/like/types/like.interface';

@Injectable()
export class HardDeletePostUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly postService: PostService,
    private readonly deleteMediaUseCase: DeleteMediaUseCase,
    private readonly likeService: LikeService,
  ) {}
  async execute(postId: number, profileId: number) {
    let mediaToDelete: { url: string }[] = [];
    const result = await this.dataSource.transaction(async (manager) => {
      const post = await this.postService.findByIdWithDeleted(postId, manager);

      if (!post) throw new NotFoundException('Пост не найден');

      if (post.profileId !== profileId)
        throw new ForbiddenException(
          'Вы не являетесь владельцем данного поста',
        );

      mediaToDelete = post.media.map((m) => ({ url: m.url })) || [];

      await this.likeService.deleteByTarget({
        targetId: post.id,
        targetType: LikeTargetType.POST,
        manager,
      });

      await this.postService.postDelete(post, manager);

      await manager.decrement(
        ProfileEntity,
        { id: post.profileId },
        'postsCount',
        1,
      );
    });

    if (mediaToDelete.length) {
      await this.deleteMediaUseCase.execute(mediaToDelete, 'post-media');
    }

    return result;
  }
}
