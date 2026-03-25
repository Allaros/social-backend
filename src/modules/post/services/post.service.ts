import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from '../entities/post.entity';
import { DataSource, Repository } from 'typeorm';
import { UploadedMedia } from '../../file/types/file.interface';
import { FileService } from '../../file/file.service';
import { PostMediaService } from './postMedia.service';
import { ProfileEntity } from '@app/modules/profile/profile.entity';
import { UserEntity } from '@app/modules/user/user.entity';
import sanitizeHtml from 'sanitize-html';
import { CreatePostBody } from '../types/post.interface';
import { SavedPostEntity } from '../entities/saved_posts';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
    @InjectRepository(SavedPostEntity)
    private readonly savedPostRepository: Repository<SavedPostEntity>,
    private readonly dataSource: DataSource,
    private readonly fileService: FileService,
    private readonly mediaService: PostMediaService,
  ) {}

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }

  async createPost(
    profileId: number,
    body: CreatePostBody,
    files?: Express.Multer.File[],
  ) {
    const { allowComments, visibility, content } = body;

    let uploadedMedia: UploadedMedia[] = [];

    try {
      if (!content && !files)
        throw new BadRequestException('Нельзя создать пустой пост');

      let safeContent: string = '';

      if (content) {
        const text = this.stripHtml(content);

        if (text.length < 5)
          throw new BadRequestException(
            'Текст должен быть не короче 5 символов',
          );

        safeContent = sanitizeHtml(content, {
          allowedTags: ['p', 'b', 'i', 'strong', 'em', 'ul', 'ol', 'li', 'br'],
          allowedAttributes: {},
        });
      }

      const newPost = await this.dataSource.transaction(async (manager) => {
        const post = await manager.save(PostEntity, {
          allowComments: allowComments ?? true,
          visibility: visibility ?? 'public',
          content: safeContent,
          profileId,
        });

        if (files?.length) {
          uploadedMedia = await this.fileService.savePostMedia(post.id, files);

          await this.mediaService.saveMany(uploadedMedia, post.id, manager);
        }

        await manager.increment(
          ProfileEntity,
          { id: profileId },
          'postsCount',
          1,
        );

        return post;
      });

      return newPost;
    } catch (error) {
      console.log(error);

      if (uploadedMedia.length) {
        await this.fileService.deletePostMedia(uploadedMedia);
      }

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Не удалось создать пост. Повторите попытку',
      );
    }
  }

  async hardDeletePost(postId: number, user: UserEntity) {
    let mediaToDelete: { url: string }[] = [];
    const result = await this.dataSource.transaction(async (manager) => {
      const post = await this.postRepository.findOne({
        where: { id: postId },
        relations: ['media'],
      });

      if (!post) throw new NotFoundException('Пост не найден');

      if (post.profileId !== user.profile.id)
        throw new ForbiddenException(
          'Вы не являетесь владельцем данного поста',
        );

      mediaToDelete = post.media.map((m) => ({ url: m.url })) || [];

      await manager.remove(post);

      await manager.decrement(
        ProfileEntity,
        { id: post.profileId },
        'postsCount',
        1,
      );
    });

    if (mediaToDelete.length) {
      await this.fileService.deletePostMedia(mediaToDelete);
    }

    return result;
  }

  async savePost(postId: string, currentProfileId: number) {
    const normalizedPostId = Number(postId);

    const existingPost = await this.savedPostRepository.findOne({
      where: {
        post: { id: normalizedPostId },
        profile: { id: currentProfileId },
      },
    });

    if (existingPost) return;

    const saved = this.savedPostRepository.create({
      profile: { id: currentProfileId },
      post: { id: normalizedPostId },
    });

    return await this.savedPostRepository.save(saved);
  }

  async unsavePost(postId: string, currentProfileId: number) {
    const normalizedPostId = Number(postId);
    await this.savedPostRepository.delete({
      profile: { id: currentProfileId },
      post: { id: normalizedPostId },
    });
  }

  buildPostResponce(posts: PostEntity[]) {
    return posts.map((post) => ({
      id: post.id,
      content: post.content,
      createdAt: post.createdAt,

      author: {
        id: post.profile.id,
        username: post.profile.username,
        name: post.profile.name,
        avatarUrl: post.profile.avatarUrl,
      },

      media: post.media.map((m) => ({
        url: m.url,
        type: m.type,
      })),

      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      repostsCount: post.repostsCount,
      viewsCount: post.viewsCount,
    }));
  }

  async getFeed(limit: number = 10) {
    const posts = this.postRepository
      .createQueryBuilder('post')
      .leftJoin('post.profile', 'profile')
      .leftJoin('post.media', 'media')
      .select([
        'post.id',
        'post.content',
        'post.createdAt',
        'post.likesCount',
        'post.commentsCount',
        'post.repostsCount',
        'post.viewsCount',

        'profile.id',
        'profile.username',
        'profile.name',
        'profile.avatarUrl',

        'media.id',
        'media.url',
        'media.type',
      ])
      .orderBy('post.createdAt', 'DESC')
      .take(limit)
      .getMany();

    return posts;
  }

  async getMyPosts(profileId: number) {
    const posts = this.postRepository.findAndCount({
      where: { profileId },
      relations: ['profile', 'media'],
    });
    return posts;
  }

  async getSavedPosts(currentProfileId: number) {
    return await this.savedPostRepository
      .createQueryBuilder('saved')
      .innerJoinAndSelect('saved.post', 'post')
      .leftJoinAndSelect('post.media', 'media')
      .leftJoinAndSelect('post.profile', 'profile')
      .where('saved.profileId = :profileId', { currentProfileId })
      .orderBy('saved.createdAt', 'DESC')
      .select(['post', 'media', 'profile'])
      .getMany()
      .then((saved) => saved.map((s) => s.post));
  }
}
