import { UploadedMedia } from '@app/modules/file/types/file.interface';
import { PostMediaEntity } from '@app/modules/post-media/entities/media.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class PostMediaService {
  constructor(
    @InjectRepository(PostMediaEntity)
    private readonly postMediaRepository: Repository<PostMediaEntity>,
  ) {}

  async attachToPost(
    media: UploadedMedia[],
    postId: number,
    manager?: EntityManager,
  ) {
    const repo = manager
      ? manager.getRepository(PostMediaEntity)
      : this.postMediaRepository;

    const entities = media.map((m) => repo.create({ ...m, postId }));

    return repo.save(entities);
  }

  async deleteMany(idsToDelete: number[], manager: EntityManager) {
    await manager.delete(PostMediaEntity, idsToDelete);
  }
}
