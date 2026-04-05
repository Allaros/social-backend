import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PostService } from '../services/post.service';

@Injectable()
export class SoftDeletePostUseCase {
  constructor(private readonly postService: PostService) {}

  async execute(postId: number, profileId: number) {
    const post = await this.postService.findByIdWithDeleted(postId);

    if (!post) throw new NotFoundException('Пост не найден');

    if (post.deletedAt) throw new BadRequestException('Пост уже удален');

    if (post.profileId !== profileId)
      throw new ForbiddenException('Вы не являетесь владельцем поста');

    await this.postService.setDeleted(post.id);
  }
}
