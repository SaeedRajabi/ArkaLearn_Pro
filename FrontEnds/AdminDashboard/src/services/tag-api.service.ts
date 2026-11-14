import apiClient from '@/lib/apiClient';

const BASE = '/Tag';

export type SearchTagItem = {
  tagName: string;
};

type SearchResponse = {
  queryResult?: SearchTagItem[] | { $values?: SearchTagItem[] };
  totalCount?: number;
};

function extractList(data: SearchResponse): SearchTagItem[] {
  const raw = data as Record<string, unknown>;
  const qr = data?.queryResult ?? raw?.queryResult ?? raw?.QueryResult;
  if (qr == null) return [];
  if (Array.isArray(qr)) return qr as SearchTagItem[];
  const withValues = qr as { $values?: SearchTagItem[] };
  return Array.isArray(withValues?.$values) ? withValues.$values : [];
}

/**
 * جستجوی تگ‌ها برای پیشنهاد در باکس تگ (اتوکامپلیت).
 * تگ‌های قبلاً ثبت‌شده (دوره، مقاله، سمینار) را برمی‌گرداند.
 */
export async function searchTags(params: {
  tagName?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<string[]> {
  const { data } = await apiClient.get<SearchResponse>(`${BASE}/Search`, {
    params: {
      TagName: params.tagName ?? '',
      PageNumber: params.pageNumber ?? 1,
      PageSize: params.pageSize ?? 20,
      NeedTotalCount: false,
    },
  });
  const list = extractList(data ?? {});
  const raw = list as Record<string, unknown>[];
  const names = raw.map(
    (x) => String(x?.tagName ?? x?.TagName ?? '').trim()
  ).filter(Boolean);
  return [...new Set(names)];
}
