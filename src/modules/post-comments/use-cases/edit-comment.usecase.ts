import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PostCommentsService } from '../services/post-comments.service';

@Injectable()
export class EditCommentUseCase {
  constructor(private readonly commentService: PostCommentsService) {}

  async execute(payload: {
    body: string;
    postId: number;
    commentId: number;
    profileId: number;
  }) {
    const { body, commentId, postId, profileId } = payload;

    const existingComment = await this.commentService.findById(
      commentId,
      postId,
    );

    const normalizedBody = body.trim();

    if (!normalizedBody) {
      throw new BadRequestException('Комментарий не может быть пустым!');
    }

    if (!existingComment) throw new NotFoundException('Комментарий не найден');

    if (existingComment.profileId !== profileId)
      throw new ForbiddenException('Вы не являетесь автором комментария');

    if (existingComment.deletedAt)
      throw new BadRequestException(
        'Нельзя редактировать удаленный комментарий',
      );

    if (existingComment.content === normalizedBody) {
      return { success: true };
    }

    await this.commentService.update(commentId, postId, {
      content: normalizedBody,
      isEdited: true,
    });

    return { success: true };
  }
}
