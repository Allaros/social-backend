import { Cursor } from '../types/feed.interface';

export function encodeCursor(cursor: Cursor) {
  return Buffer.from(JSON.stringify(cursor)).toString('base64');
}
