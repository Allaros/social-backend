import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PostService } from '../services/post.service';

@Injectable()
export class RecoverPostUseCase {
  constructor(private readonly postService: PostService) {}

  async execute(postId: number, profileId: number) {
    const post = await this.postService.findByIdWithDeleted(postId);

    if (!post) throw new NotFoundException('Пост не найден');

    if (!post.deletedAt) throw new BadRequestException('Данный пост не удален');

    if (post.profileId !== profileId)
      throw new ForbiddenException('Вы не являетесь владельцем данного поста');

    return await this.postService.recoverPost(post.id);
  }
}
