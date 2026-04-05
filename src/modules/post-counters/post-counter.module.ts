import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from '../post/entities/post.entity';
import { PostCounterService } from './post-counter.service';

@Module({
  imports: [TypeOrmModule.forFeature([PostEntity])],
  providers: [PostCounterService],
  exports: [PostCounterService],
})
export class PostCounterModule {}
