import { PostResponseDto } from '@app/modules/feed/types/feed.interface';
import { stripHtml } from '@app/modules/post/helpers/process-content';

export const getPostPrimary = (post: PostResponseDto): string => {
  const content = stripHtml(post.content || '').trim();

  if (content) return content;

  const media = post.media || [];

  if (!media.length) return 'Пост';

  const imagesCount = media.filter((m) => m.type === 'image').length;
  const videosCount = media.filter((m) => m.type === 'video').length;

  if (imagesCount && videosCount) {
    return `📷 ${imagesCount} · 🎥 ${videosCount}`;
  }

  if (imagesCount) {
    return imagesCount === 1 ? '📷 Фото' : `📷 ${imagesCount} фото`;
  }

  if (videosCount) {
    return videosCount === 1 ? '🎥 Видео' : `🎥 ${videosCount} видео`;
  }

  return 'Пост';
};
