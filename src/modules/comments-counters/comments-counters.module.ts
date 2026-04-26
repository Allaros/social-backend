import { Module } from '@nestjs/common';
import { CommentsCountersService } from './comments-counters.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentEntity } from '../post-comments/entities/comment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CommentEntity])],
  providers: [CommentsCountersService],
  exports: [CommentsCountersService],
})
export class CommentsCountersModule {}
