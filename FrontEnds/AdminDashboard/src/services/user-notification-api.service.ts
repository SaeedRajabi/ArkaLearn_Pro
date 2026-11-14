import apiClient from '@/lib/apiClient';
import { apiWriteUpdate } from '@/lib/api-write';

export type UserNotificationItem = {
  id: number;
  title: string;
  body: string;
  type: string;
  linkUrl?: string | null;
  relatedEntityId?: number | null;
  isRead: boolean;
  createdAt: string;
  readAt?: string | null;
};

export type PagedUserNotifications = {
  page: number;
  pageSize: number;
  totalCount: number;
  items: UserNotificationItem[];
};

function unwrap<T>(raw: unknown): T | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if ('data' in obj && obj.data != null) return unwrap<T>(obj.data);
  if ('queryResult' in obj && obj.queryResult != null) return unwrap<T>(obj.queryResult);
  if ('result' in obj && obj.result != null) return unwrap<T>(obj.result);
  return obj as T;
}

function extractList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    const obj = raw as { $values?: unknown[]; data?: unknown; Data?: unknown; items?: unknown; Items?: unknown };
    if (Array.isArray(obj.$values)) return obj.$values;
    if (Array.isArray(obj.items)) return obj.items;
    if (Array.isArray(obj.Items)) return obj.Items;
    if (obj.data) return extractList(obj.data);
    if (obj.Data) return extractList(obj.Data);
  }
  return [];
}

function mapItem(row: Record<string, unknown>): UserNotificationItem {
  return {
    id: Number(row.id ?? row.Id ?? 0),
    title: String(row.title ?? row.Title ?? ''),
    body: String(row.body ?? row.Body ?? ''),
    type: String(row.type ?? row.Type ?? ''),
    linkUrl: (row.linkUrl ?? row.LinkUrl ?? null) as string | null,
    relatedEntityId: row.relatedEntityId != null || row.RelatedEntityId != null
      ? Number(row.relatedEntityId ?? row.RelatedEntityId)
      : null,
    isRead: Boolean(row.isRead ?? row.IsRead),
    createdAt: String(row.createdAt ?? row.CreatedAt ?? ''),
    readAt: (row.readAt ?? row.ReadAt ?? null) as string | null,
  };
}

function normalizePaged(raw: unknown): PagedUserNotifications {
  const layer = unwrap<Record<string, unknown>>(raw) ?? {};
  const items = extractList(layer.items ?? layer.Items ?? layer).map((x) =>
    mapItem(x as Record<string, unknown>),
  );

  return {
    page: Number(layer.page ?? layer.Page ?? 1),
    pageSize: Number(layer.pageSize ?? layer.PageSize ?? (items.length || 5)),
    totalCount: Number(layer.totalCount ?? layer.TotalCount ?? items.length),
    items,
  };
}

export async function getMyNotificationsPaged(
  page = 1,
  pageSize = 5,
): Promise<PagedUserNotifications> {
  const res = await apiClient.get<unknown>('/UserNotification/GetMy', {
    params: { page, pageSize },
  });
  return normalizePaged(res.data);
}

export async function getMyNotifications(take = 30): Promise<UserNotificationItem[]> {
  const res = await apiClient.get<unknown>('/UserNotification/GetMy', { params: { take } });
  const paged = normalizePaged(res.data);
  return paged.items;
}

export async function getUnreadNotificationCount(): Promise<number> {
  const res = await apiClient.get<unknown>('/UserNotification/UnreadCount');
  const payload = unwrap<unknown>(res.data);
  if (typeof payload === 'number') return payload;
  if (payload && typeof payload === 'object') {
    const n = Number((payload as Record<string, unknown>).count ?? (payload as Record<string, unknown>).Count);
    if (Number.isFinite(n)) return n;
  }
  return Number(payload) || 0;
}

export async function markNotificationRead(notificationId: number): Promise<void> {
  await apiWriteUpdate('/UserNotification/MarkRead', { notificationId });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiWriteUpdate('/UserNotification/MarkAllRead', {});
}

export async function deleteNotification(notificationId: number): Promise<void> {
  await apiWriteUpdate('/UserNotification/Delete', { notificationId });
}
