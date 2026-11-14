import apiClient from '@/lib/apiClient';

export type PlatformSupportTopicDepartment =
  | 'Support'
  | 'Services'
  | 'Sales'
  | 'SoftwareDevelopment'
  | '';

export type PlatformSupportTopicListItem = {
  id: number;
  title: string;
  summary: string;
  department?: string | null;
  sortOrder: number;
  isPublished: boolean;
  isAdminTopic: boolean;
};

export type PlatformSupportTopicDetail = PlatformSupportTopicListItem & {
  contentHtml: string;
};

function unwrap<T>(raw: unknown): T | null {
  if (!raw || typeof raw !== 'object') return null;
  const root = raw as Record<string, unknown>;
  const layer = root.data ?? root.Data ?? root;
  return (typeof layer === 'object' && layer !== null ? layer : root) as T;
}

function normalizeListItem(raw: Record<string, unknown>): PlatformSupportTopicListItem {
  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    title: String(raw.title ?? raw.Title ?? ''),
    summary: String(raw.summary ?? raw.Summary ?? ''),
    department: raw.department != null || raw.Department != null
      ? String(raw.department ?? raw.Department ?? '')
      : null,
    sortOrder: Number(raw.sortOrder ?? raw.SortOrder ?? 0),
    isPublished: Boolean(raw.isPublished ?? raw.IsPublished ?? true),
    isAdminTopic: Boolean(raw.isAdminTopic ?? raw.IsAdminTopic ?? true),
  };
}

function normalizeDetail(raw: Record<string, unknown>): PlatformSupportTopicDetail {
  return {
    ...normalizeListItem(raw),
    contentHtml: String(raw.contentHtml ?? raw.ContentHtml ?? ''),
  };
}

export async function listPlatformSupportTopics(): Promise<PlatformSupportTopicListItem[]> {
  const res = await apiClient.get<unknown>('/PlatformSupportTopic/List');
  const data = unwrap<unknown[]>(res.data);
  if (!Array.isArray(data)) return [];
  return data
    .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === 'object')
    .map(normalizeListItem);
}

export async function getPlatformSupportTopicById(id: number): Promise<PlatformSupportTopicDetail | null> {
  const res = await apiClient.get<unknown>('/PlatformSupportTopic/GetById', { params: { id } });
  const data = unwrap<Record<string, unknown>>(res.data);
  return data ? normalizeDetail(data) : null;
}

export async function upsertPlatformSupportTopic(payload: {
  id?: number | null;
  title: string;
  summary: string;
  contentHtml: string;
  department?: string | null;
  sortOrder: number;
  isPublished: boolean;
}): Promise<number> {
  const res = await apiClient.post<unknown>('/PlatformSupportTopic/Upsert', payload);
  const data = unwrap<string | number>(res.data);
  return Number(data ?? payload.id ?? 0);
}

export async function deletePlatformSupportTopic(id: number): Promise<void> {
  await apiClient.post('/PlatformSupportTopic/Delete', { id });
}
