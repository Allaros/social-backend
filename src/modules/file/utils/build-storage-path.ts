import { nanoid } from 'nanoid';

export function buildAttachmentPath(chatId: number, mimeType: string): string {
  const ext = mimeType.split('/')[1] ?? 'bin';
  return `${chatId}/${nanoid()}.${ext}`;
}

export function buildChatAvatarPath(mimeType: string) {
  const ext = mimeType.split('/')[1] ?? 'bin';

  return `chat-avatars/${nanoid()}.${ext}`;
}
