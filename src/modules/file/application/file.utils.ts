import { nanoid } from 'nanoid';
import { Format } from '../types/file.interface';

export function extractPathFromUrl(url: string) {
  const parts = url.split('/post-media/');
  return parts[1];
}

export function generateFileName(
  base: string,
  id: number | string,
  format: Format,
) {
  const suffix = nanoid(6);

  return `${base}-${id}-${suffix}.${format}`;
}
