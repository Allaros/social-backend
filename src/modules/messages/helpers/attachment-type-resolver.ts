import { MessagesAttachmentEnum } from '../types/messages-attachment.interface';

export function resolveAttachmentType(
  mimeType: string,
): MessagesAttachmentEnum {
  const normalizedMimeType = mimeType.toLowerCase();

  if (normalizedMimeType.startsWith('image/')) {
    return MessagesAttachmentEnum.IMAGE;
  }

  if (normalizedMimeType.startsWith('video/')) {
    return MessagesAttachmentEnum.VIDEO;
  }

  if (normalizedMimeType.startsWith('audio/ogg')) {
    return MessagesAttachmentEnum.VOICE;
  }

  if (normalizedMimeType.startsWith('audio/')) {
    return MessagesAttachmentEnum.AUDIO;
  }

  return MessagesAttachmentEnum.FILE;
}
