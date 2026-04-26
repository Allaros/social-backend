import { BadRequestException } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

export function processContent(content?: string) {
  if (!content) return '';

  const text = stripHtml(content);

  if (text.length < 5) {
    throw new BadRequestException('Текст должен быть не короче 5 символов');
  }

  return sanitizeHtml(content, {
    allowedTags: ['p', 'b', 'i', 'strong', 'em', 'ul', 'ol', 'li', 'br'],
    allowedAttributes: {},
  });
}
