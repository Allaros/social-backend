import { Cursor } from '../types/feed.interface';

export function decodeCursor(cursor?: string): Cursor | null {
  if (!cursor) return null;

  const decoded = JSON.parse(
    Buffer.from(cursor, 'base64').toString(),
  ) as Cursor;

  console.log('DECODED CURSOR:', cursor);

  return decoded;
}
