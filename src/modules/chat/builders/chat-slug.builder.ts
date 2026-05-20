import { nanoid } from 'nanoid';
import slugify from 'slugify';

export function slugifyString(baseString: string) {
  return slugify(baseString, {
    lower: true,
    strict: true,
    trim: true,
  });
}

export function generateUniqueSlug(baseString: string) {
  const slug = slugify(baseString, {
    lower: true,
    strict: true,
    trim: true,
  });

  const suffix = nanoid(6);

  return `${slug}-${suffix}`;
}
