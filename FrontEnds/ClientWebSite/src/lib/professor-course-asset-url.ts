import { getCourseImageUrl } from '@/lib/utils/image-url';

/** Resolve course/media paths for inline previews (ported from admin dashboard). */
export function toSameOriginAssetSrc(
  value?: string | File | null
): string | undefined {
  if (value == null) return undefined;
  if (value instanceof File) return URL.createObjectURL(value);
  const trimmed = String(value).trim();
  if (!trimmed) return undefined;
  if (/^(blob:|data:)/i.test(trimmed)) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return getCourseImageUrl(trimmed);
}
