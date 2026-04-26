import { Module } from '@nestjs/common';
import { PostMediaService } from './services/post-media.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostMediaEntity } from './entities/media.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PostMediaEntity])],
  providers: [PostMediaService],
  exports: [PostMediaService],
})
export class PostMediaModule {}
