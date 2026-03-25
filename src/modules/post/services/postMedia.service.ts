import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { PostMediaEntity } from '../entities/media.entity';
import { UploadedMedia } from '@app/modules/file/types/file.interface';

@Injectable()
export class PostMediaService {
  constructor(
    @InjectRepository(PostMediaEntity)
    private readonly mediaRepository: Repository<PostMediaEntity>,
  ) {}

  async saveMany(
    media: UploadedMedia[],
    postId: number,
    manager?: EntityManager,
  ) {
    const repo = manager
      ? manager.getRepository(PostMediaEntity)
      : this.mediaRepository;
    const entities = media.map((m) => repo.create({ ...m, postId }));

    return repo.save(entities);
  }
}
