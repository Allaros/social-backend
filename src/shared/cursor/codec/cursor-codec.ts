import { CursorShape } from '../types/cursor.interface';

export class CursorCodec<TCursor extends CursorShape> {
  constructor(private keys: (keyof TCursor)[]) {}

  encode(cursor: TCursor): string {
    return Buffer.from(JSON.stringify(cursor)).toString('base64');
  }

  decode(cursor: string): TCursor {
    try {
      const parsed: unknown = JSON.parse(
        Buffer.from(cursor, 'base64').toString('utf-8'),
      );

      if (!validateCursor<TCursor>(parsed, this.keys)) {
        throw new Error('Invalid cursor shape');
      }

      return parsed;
    } catch {
      throw new Error('Invalid cursor');
    }
  }
}

function validateCursor<T extends CursorShape>(
  value: unknown,
  keys: (keyof T)[],
): value is T {
  if (typeof value !== 'object' || value === null) return false;

  const obj = value as Record<string, unknown>;

  return keys.every((key) => key in obj);
}
