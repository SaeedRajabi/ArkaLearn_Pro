import { apiRequest } from './client';
import { unwrapApiList } from '@/lib/api/normalize-list';

const BASE = 'PlatformSupportTopic';

export type PlatformSupportTopicRow = {
  id: number;
  title: string;
  summary: string;
  department?: string | null;
  sortOrder: number;
  isPublished: boolean;
  isAdminTopic: boolean;
};

export type PlatformSupportTopicDetail = PlatformSupportTopicRow & {
  contentHtml: string;
};

function normalizeRow(raw: Record<string, unknown>): PlatformSupportTopicRow {
  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    title: String(raw.title ?? raw.Title ?? ''),
    summary: String(raw.summary ?? raw.Summary ?? ''),
    department:
      raw.department != null || raw.Department != null
        ? String(raw.department ?? raw.Department ?? '')
        : null,
    sortOrder: Number(raw.sortOrder ?? raw.SortOrder ?? 0),
    isPublished: Boolean(raw.isPublished ?? raw.IsPublished ?? true),
    isAdminTopic: Boolean(raw.isAdminTopic ?? raw.IsAdminTopic ?? true),
  };
}

function normalizeDetail(raw: Record<string, unknown>): PlatformSupportTopicDetail {
  return {
    ...normalizeRow(raw),
    contentHtml: String(raw.contentHtml ?? raw.ContentHtml ?? ''),
  };
}

export async function getPublishedPlatformSupportTopics(): Promise<PlatformSupportTopicRow[]> {
  const raw = await apiRequest<unknown>(`${BASE}/ListPublished`, { credentials: 'include' });
  const list = unwrapApiList(raw);
  return list
    .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === 'object')
    .map(normalizeRow)
    .filter((x) => x.id > 0);
}

export async function getPublishedPlatformSupportTopic(
  id: number
): Promise<PlatformSupportTopicDetail | null> {
  const raw = await apiRequest<unknown>(`${BASE}/GetPublishedById?id=${id}`, {
    credentials: 'include',
  });
  if (!raw || typeof raw !== 'object') return null;
  const root = raw as Record<string, unknown>;
  const data = (root.data ?? root.Data ?? raw) as Record<string, unknown>;
  if (!data || typeof data !== 'object') return null;
  const detail = normalizeDetail(data);
  return detail.id > 0 ? detail : null;
}
