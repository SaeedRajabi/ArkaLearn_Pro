import { apiRequest, buildQuery } from './client';

export async function searchTags(params?: {
  tagName?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<string[]> {
  const path = `Tag/Search${buildQuery({
    TagName: params?.tagName ?? '',
    PageNumber: params?.pageNumber ?? 1,
    PageSize: params?.pageSize ?? 20,
    NeedTotalCount: false,
  })}`;

  try {
    const raw = await apiRequest<{
      queryResult?: Array<{ tagName?: string; TagName?: string }> | { $values?: Array<{ tagName?: string; TagName?: string }> };
    }>(path);

    const list = Array.isArray(raw?.queryResult)
      ? raw.queryResult
      : raw?.queryResult && typeof raw.queryResult === 'object' && '$values' in raw.queryResult
        ? (raw.queryResult as { $values?: Array<{ tagName?: string; TagName?: string }> }).$values ?? []
        : [];

    return [...new Set(list.map((x) => String(x.tagName ?? x.TagName ?? '').trim()).filter(Boolean))];
  } catch {
    return [];
  }
}
