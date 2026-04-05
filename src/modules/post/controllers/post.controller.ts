import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Put,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/auth.guard';
import { EmailVerifiedGuard } from '../../auth/guards/email-verified.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreatePostDto, EditPostDto } from '../types/post.dto';
import { CurrentUser } from '@app/shared/decorators/currentUser.decorator';
import { UserEntity } from '../../user/user.entity';
import { CreatePostUseCase } from '../use-cases/create-post.usecase';
import { HardDeletePostUseCase } from '../use-cases/hard-delete-post.usecase';
import { PostService } from '../services/post.service';
import { RecoverPostUseCase } from '../use-cases/recover-post.usecase';
import { SoftDeletePostUseCase } from '../use-cases/soft-delete-post.usecase';

@Controller('posts')
export class PostController {
  constructor(
    private readonly createPostUseCase: CreatePostUseCase,
    private readonly hardDeletePostUseCase: HardDeletePostUseCase,
    private readonly softDeletePostUseCase: SoftDeletePostUseCase,
    private readonly recoverPostUseCase: RecoverPostUseCase,
    private readonly postService: PostService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  @UseInterceptors(FilesInterceptor('media'))
  create(
    @CurrentUser() user: UserEntity,
    @Body() dto: CreatePostDto,
    @UploadedFiles() media?: Express.Multer.File[],
  ) {
    console.log(dto);
    return this.createPostUseCase.execute(user.profile.id, dto, media);
  }

  @Delete(':id/hard')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async postHardDelete(
    @Param('id') postId: string,
    @CurrentUser() user: UserEntity,
  ) {
    await this.hardDeletePostUseCase.execute(Number(postId), user.profile.id);

    return { success: true };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async postSoftDelete(
    @Param('id') postId: string,
    @CurrentUser() user: UserEntity,
  ) {
    await this.softDeletePostUseCase.execute(Number(postId), user.profile.id);

    return { success: true };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async postRecover(
    @Param('id') postId: string,
    @CurrentUser() user: UserEntity,
  ) {
    const post = await this.recoverPostUseCase.execute(
      Number(postId),
      user.profile.id,
    );

    return post;
  }

  @Put('edit/:id')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  @UseInterceptors(FilesInterceptor('media'))
  async editPost(@Body dto: EditPostDto)
}
