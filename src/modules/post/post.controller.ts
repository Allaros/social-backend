import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { PostService } from './services/post.service';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreatePostDto } from './types/post.dto';
import { CurrentUser } from '@app/shared/decorators/currentUser.decorator';
import { UserEntity } from '../user/user.entity';
import { DiskMulterFile } from '../file/types/file.interface';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  @UseInterceptors(
    FilesInterceptor('media', 10, {
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|webp|mp4|mov)$/)) {
          cb(null, true);
        } else {
          cb(new Error('Неверный тип файла'), false);
        }
      },
      limits: {
        fileSize: 20 * 1024 * 1024,
      },
    }),
  )
  @UsePipes(new ValidationPipe({ transform: true }))
  async createPost(
    @Body() body: CreatePostDto,
    @CurrentUser() user: UserEntity,
    @UploadedFiles() media?: DiskMulterFile[],
  ) {
    console.log(media);
    console.log(body);

    const post = await this.postService.createPost(
      user.profile.id,
      body,
      media,
    );

    return { post };
  }

  @Get()
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async getPosts() {
    const posts = await this.postService.getFeed(10);

    return posts;
  }

  @Delete('hard-delete/:postId')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async postHardDelete(
    @Param('postId') postId: string,
    @CurrentUser() user: UserEntity,
  ) {
    await this.postService.hardDeletePost(Number(postId), user);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async getMyPosts(@CurrentUser() user: UserEntity) {
    const [posts] = await this.postService.getMyPosts(user.profile.id);

    return this.postService.buildPostResponce(posts);
  }

  @Post('save/:postId')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async savePost(@Param() postId: string, @CurrentUser() user: UserEntity) {
    const savedPost = await this.postService.savePost(postId, user.profile.id);

    return savedPost;
  }

  @Delete('save/:postId')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async unsavePost(@Param() postId: string, @CurrentUser() user: UserEntity) {
    await this.postService.unsavePost(postId, user.profile.id);

    return { success: true };
  }

  @Get('save')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async getSavedPosts(@CurrentUser() user: UserEntity) {
    const posts = await this.postService.getSavedPosts(user.profile.id);
    return posts;
  }
}
