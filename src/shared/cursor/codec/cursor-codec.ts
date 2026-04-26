import { CursorShape } from '../types/cursor.interface';

export class CursorCodec<TCursor extends CursorShape> {
  constructor(private keys: (keyof TCursor)[]) {}

  private validateCursor<T extends CursorShape>(
    value: unknown,
    keys: (keyof T)[],
  ): value is T {
    if (typeof value !== 'object' || value === null) return false;

    const obj = value as Record<string, unknown>;

    if (Object.keys(obj).length !== keys.length) return false;

    return keys.every((key) => {
      const val = obj[key as string];

      if (val === undefined || val === null) return false;

      const type = typeof val;

      if (type !== 'string' && type !== 'number') return false;

      if (type === 'number' && !Number.isFinite(val)) return false;

      return true;
    });
  }

  encode(cursor: TCursor): string {
    return Buffer.from(JSON.stringify(cursor)).toString('base64');
  }

  decode(cursor?: string): TCursor | null {
    if (!cursor) return null;

    try {
      const parsed: unknown = JSON.parse(
        Buffer.from(cursor, 'base64').toString('utf-8'),
      );

      return this.validateCursor<TCursor>(parsed, this.keys) ? parsed : null;
    } catch (e) {
      console.warn('[CursorCodec] Decode failed', e);
      return null;
    }
  }
}
