import { apiRequest } from './client';

const VISITOR_KEY_STORAGE = 'arka_visitor_key';

export function getOrCreateVisitorKey(): string {
  if (typeof window === 'undefined') return '';
  try {
    const existing = localStorage.getItem(VISITOR_KEY_STORAGE);
    if (existing) return existing;
    const created = crypto.randomUUID().replace(/-/g, '');
    localStorage.setItem(VISITOR_KEY_STORAGE, created);
    return created;
  } catch {
    return crypto.randomUUID().replace(/-/g, '');
  }
}

export type TrackUserActivityPayload = {
  visitorKey: string;
  actionType?: string;
  actionTitle?: string;
  pagePath: string;
  pageTitle?: string;
  referrer?: string;
  siteSource?: 'client' | 'admin';
  metadataJson?: string;
};

export async function trackUserActivity(payload: TrackUserActivityPayload): Promise<void> {
  try {
    await apiRequest<unknown>('UserActivity/Track', {
      method: 'POST',
      credentials: 'include',
      body: {
        visitorKey: payload.visitorKey,
        actionType: payload.actionType ?? 'PageView',
        actionTitle: payload.actionTitle ?? '',
        pagePath: payload.pagePath,
        pageTitle: payload.pageTitle ?? '',
        referrer: payload.referrer ?? '',
        siteSource: payload.siteSource ?? 'client',
        metadataJson: payload.metadataJson ?? '',
      },
    });
  } catch {
    // fire-and-forget
  }
}
