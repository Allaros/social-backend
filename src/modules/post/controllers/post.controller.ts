import {
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/guards/auth.guard';
import { EmailVerifiedGuard } from '../../auth/guards/email-verified.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreatePostDto, EditPostDto } from '../types/post.dto';
import { CurrentUser } from '@app/shared/decorators/currentUser.decorator';
import { UserEntity } from '../../user/user.entity';
import { CreatePostUseCase } from '../use-cases/create-post.usecase';
import { HardDeletePostUseCase } from '../use-cases/hard-delete-post.usecase';
import { RecoverPostUseCase } from '../use-cases/recover-post.usecase';
import { SoftDeletePostUseCase } from '../use-cases/soft-delete-post.usecase';
import { EditPostUseCase } from '../use-cases/edit-post.usecase';
import { AddViewUseCase } from '../use-cases/add-view.usecase';

@Controller('posts')
export class PostController {
  constructor(
    private readonly createPostUseCase: CreatePostUseCase,
    private readonly hardDeletePostUseCase: HardDeletePostUseCase,
    private readonly softDeletePostUseCase: SoftDeletePostUseCase,
    private readonly recoverPostUseCase: RecoverPostUseCase,
    private readonly editPostUseCase: EditPostUseCase,
    private readonly addViewUseCase: AddViewUseCase,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(FilesInterceptor('media'))
  create(
    @CurrentUser() user: UserEntity,
    @Body() dto: CreatePostDto,
    @UploadedFiles() media?: Express.Multer.File[],
  ) {
    console.log(dto);
    return this.createPostUseCase.execute(user.profile.id, dto, media);
  }

  @Put('edit/:id')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(FilesInterceptor('media'))
  async editPost(
    @Body() dto: EditPostDto,
    @Param('id', ParseIntPipe) postId: number,
    @CurrentUser() user: UserEntity,
    @UploadedFiles() media?: Express.Multer.File[],
  ) {
    return await this.editPostUseCase.execute(
      postId,
      user.profile.id,
      dto,
      media,
    );
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

  @Post(':id/view')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async addView(
    @Param('id') id: number,
    @CurrentUser() user: UserEntity,
    @Req() req: Request,
  ) {
    await this.addViewUseCase.execute(Number(id), user.profile.id, req.ip);

    return { success: true };
  }
}
