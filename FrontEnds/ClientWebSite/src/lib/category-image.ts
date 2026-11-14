import { getCourseImageUrl } from '@/lib/utils/image-url';

export const DEFAULT_CATEGORY_IMAGE = '/images/categories/default-category.svg';

export function getCategoryImageUrl(imageUrl?: string | null): string {
  const trimmed = imageUrl?.trim();
  if (!trimmed) return DEFAULT_CATEGORY_IMAGE;
  return getCourseImageUrl(trimmed);
}
