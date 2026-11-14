import { apiRequest } from './client';

const BASE = 'UserNotification';

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

function extractList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    const obj = raw as {
      $values?: unknown[];
      data?: unknown;
      Data?: unknown;
      items?: unknown;
      Items?: unknown;
    };
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

export async function getMyNotifications(take = 30): Promise<UserNotificationItem[]> {
  const raw = await apiRequest<unknown>(`${BASE}/GetMy?take=${take}`);
  return extractList(raw).map((x) => mapItem(x as Record<string, unknown>));
}

export async function getUnreadNotificationCount(): Promise<number> {
  const raw = await apiRequest<unknown>(`${BASE}/UnreadCount`);
  if (typeof raw === 'number') return raw;
  if (raw && typeof raw === 'object') {
    const n = Number((raw as Record<string, unknown>).count ?? (raw as Record<string, unknown>).Count);
    if (Number.isFinite(n)) return n;
  }
  return Number(raw) || 0;
}

export async function markNotificationRead(notificationId: number): Promise<void> {
  await apiRequest(`${BASE}/MarkRead`, {
    method: 'POST',
    body: { notificationId },
  });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiRequest(`${BASE}/MarkAllRead`, { method: 'POST', body: {} });
}

export async function deleteNotification(notificationId: number): Promise<void> {
  await apiRequest(`${BASE}/Delete`, {
    method: 'POST',
    body: { notificationId },
  });
}
