import apiClient from '@/lib/apiClient';
import { getCommandMessages, isCommandResponseSuccess } from '@/lib/api-command-result';

const BASE = '/SiteAnnouncement';

export type SiteAnnouncementBackgroundType = 0 | 1 | 2;

export type SiteAnnouncementSettingsDto = {
  id?: number;
  isEnabled: boolean;
  contentHtml: string;
  textColor: string;
  backgroundType: SiteAnnouncementBackgroundType;
  backgroundColor: string;
  gradientStartColor: string;
  gradientEndColor: string;
  gradientAngle: number;
  backgroundImageUrl: string;
  lastModifiedAt?: string;
};

export type UpsertSiteAnnouncementPayload = Omit<SiteAnnouncementSettingsDto, 'id' | 'lastModifiedAt'> & {
  backgroundImageFile?: File | null;
  clearBackgroundImage?: boolean;
};

function normalizeSiteAnnouncement(raw: Record<string, unknown>): SiteAnnouncementSettingsDto {
  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    isEnabled: Boolean(raw.isEnabled ?? raw.IsEnabled ?? false),
    contentHtml: String(raw.contentHtml ?? raw.ContentHtml ?? ''),
    textColor: String(raw.textColor ?? raw.TextColor ?? '#ffffff'),
    backgroundType: Number(raw.backgroundType ?? raw.BackgroundType ?? 0) as SiteAnnouncementBackgroundType,
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

export const DEFAULT_SITE_ANNOUNCEMENT_SETTINGS: UpsertSiteAnnouncementPayload = {
  isEnabled: false,
  contentHtml: '<p>🎉 خبر مهم: به‌زودی رویداد ویژه‌ای برگزار می‌شود!</p>',
  textColor: '#ffffff',
  backgroundType: 0,
  backgroundColor: '#2563eb',
  gradientStartColor: '#2563eb',
  gradientEndColor: '#7c3aed',
  gradientAngle: 90,
  backgroundImageUrl: '',
};

export async function getSiteAnnouncementSettings(): Promise<SiteAnnouncementSettingsDto | null> {
  try {
    const { data } = await apiClient.get<unknown>(`${BASE}/Get`);
    const layer = unwrapSiteAnnouncementPayload(data);
    if (!layer) return null;
    return normalizeSiteAnnouncement(layer);
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 404) return null;
    throw error;
  }
}

export async function upsertSiteAnnouncementSettings(payload: UpsertSiteAnnouncementPayload): Promise<void> {
  const formData = new FormData();

  formData.append('IsEnabled', String(payload.isEnabled));
  formData.append('ContentHtml', payload.contentHtml ?? '');
  formData.append('TextColor', payload.textColor ?? '#ffffff');
  formData.append('BackgroundType', String(payload.backgroundType ?? 0));
  formData.append('BackgroundColor', payload.backgroundColor ?? '#2563eb');
  formData.append('GradientStartColor', payload.gradientStartColor ?? '#2563eb');
  formData.append('GradientEndColor', payload.gradientEndColor ?? '#7c3aed');
  formData.append('GradientAngle', String(payload.gradientAngle ?? 90));
  formData.append('BackgroundImageUrl', payload.backgroundImageUrl ?? '');
  formData.append('ClearBackgroundImage', String(Boolean(payload.clearBackgroundImage)));

  if (payload.backgroundImageFile) {
    formData.append('BackgroundImageFile', payload.backgroundImageFile);
  }

  const res = await apiClient.post<unknown>(`${BASE}/Upsert`, formData);
  if (!isCommandResponseSuccess(res.data, res.status)) {
    const msgs = getCommandMessages(res.data);
    throw new Error(msgs[0] || 'Failed to save site announcement settings.');
  }
}
