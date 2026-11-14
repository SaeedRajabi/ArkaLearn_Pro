import { apiRequest } from './client';

export type CartRecommendationCourse = {
  id: number;
  slug: string;
  title: string;
  shortDescription?: string | null;
  titleImage?: string | null;
  price: number;
  originalPrice?: number | null;
  categoryName?: string;
  categoryId?: number | null;
  teacherName?: string;
};

export type CartRecommendations = {
  pathCompletionPercent: number;
  cartCourseCount: number;
  pathSize: number;
  suggestions: CartRecommendationCourse[];
};

function unwrapData<T>(raw: unknown): T | null {
  if (!raw || typeof raw !== 'object') return null;
  const root = raw as Record<string, unknown>;
  const layer = root.data ?? root.Data ?? root;
  return (typeof layer === 'object' && layer !== null ? layer : root) as T;
}

function normalizeList<T>(raw: unknown): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as T[];
  if (typeof raw === 'object' && raw !== null && Array.isArray((raw as { $values?: T[] }).$values)) {
    return (raw as { $values: T[] }).$values;
  }
  return [];
}

export async function getCartRecommendations(courseIds: number[]): Promise<CartRecommendations> {
  const raw = await apiRequest<unknown>('Course/GetCartRecommendations', {
    method: 'POST',
    body: { courseIds },
    timeoutMs: 25000,
  });

  const data = unwrapData<Record<string, unknown>>(raw) ?? {};
  const suggestionsRaw = normalizeList<Record<string, unknown>>(
    data.suggestions ?? data.Suggestions
  );

  return {
    pathCompletionPercent: Number(data.pathCompletionPercent ?? data.PathCompletionPercent ?? 0),
    cartCourseCount: Number(data.cartCourseCount ?? data.CartCourseCount ?? courseIds.length),
    pathSize: Number(data.pathSize ?? data.PathSize ?? Math.max(courseIds.length, 3)),
    suggestions: suggestionsRaw.map((s) => ({
      id: Number(s.id ?? s.Id ?? 0),
      slug: String(s.slug ?? s.Slug ?? ''),
      title: String(s.title ?? s.Title ?? ''),
      shortDescription: (s.shortDescription ?? s.ShortDescription ?? null) as string | null,
      titleImage: (s.titleImage ?? s.TitleImage ?? null) as string | null,
      price: Number(s.price ?? s.Price ?? 0),
      originalPrice:
        s.originalPrice != null || s.OriginalPrice != null
          ? Number(s.originalPrice ?? s.OriginalPrice)
          : null,
      categoryName: String(s.categoryName ?? s.CategoryName ?? ''),
      categoryId:
        s.categoryId != null || s.CategoryId != null
          ? Number(s.categoryId ?? s.CategoryId)
          : null,
      teacherName: String(s.teacherName ?? s.TeacherName ?? ''),
    })),
  };
}
