import { cache } from 'react';
import { apiRequest } from './client';

const BASE = 'SiteAnnouncement';

export type SiteAnnouncementQri = {
  id: number;
  isEnabled: boolean;
  contentHtml: string;
  textColor: string;
  backgroundType: 0 | 1 | 2;
  backgroundColor: string;
  gradientStartColor: string;
  gradientEndColor: string;
  gradientAngle: number;
  backgroundImageUrl: string;
  lastModifiedAt?: string;
};

function normalizeSiteAnnouncement(raw: Record<string, unknown>): SiteAnnouncementQri {
  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    isEnabled: Boolean(raw.isEnabled ?? raw.IsEnabled ?? false),
    contentHtml: String(raw.contentHtml ?? raw.ContentHtml ?? ''),
    textColor: String(raw.textColor ?? raw.TextColor ?? '#ffffff'),
    backgroundType: Number(raw.backgroundType ?? raw.BackgroundType ?? 0) as 0 | 1 | 2,
    backgroundColor: String(raw.backgroundColor ?? raw.BackgroundColor ?? '#2563eb'),
    gradientStartColor: String(raw.gradientStartColor ?? raw.GradientStartColor ?? '#2563eb'),
    gradientEndColor: String(raw.gradientEndColor ?? raw.GradientEndColor ?? '#7c3aed'),
    gradientAngle: Number(raw.gradientAngle ?? raw.GradientAngle ?? 90),
    backgroundImageUrl: String(raw.backgroundImageUrl ?? raw.BackgroundImageUrl ?? ''),
    lastModifiedAt: String(raw.lastModifiedAt ?? raw.LastModifiedAt ?? ''),
  };
}

function unwrapSiteAnnouncementPayload(payload: unknown): Record<string, unknown> | null {
  let cur: unknown = payload;
  for (let depth = 0; depth < 8; depth++) {
    if (!cur || typeof cur !== 'object' || Array.isArray(cur)) return null;
    const obj = cur as Record<string, unknown>;
    if ('contentHtml' in obj || 'ContentHtml' in obj || 'isEnabled' in obj || 'IsEnabled' in obj) return obj;
    const next = obj.data ?? obj.Data ?? obj.queryResult ?? obj.QueryResult ?? obj.result ?? obj.Result;
    if (next === cur) break;
    cur = next;
  }
  return null;
}

export const getSiteAnnouncement = cache(async (): Promise<SiteAnnouncementQri | null> => {
  try {
    const result = await apiRequest<unknown>(`${BASE}/Get`, {
      method: 'GET',
      timeoutMs: 8000,
    });
    const layer = unwrapSiteAnnouncementPayload(result);
    if (!layer) return null;
    return normalizeSiteAnnouncement(layer);
  } catch {
    return null;
  }
});
