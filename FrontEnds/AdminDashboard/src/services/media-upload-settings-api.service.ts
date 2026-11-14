import apiClient from '@/lib/apiClient';

export type MediaUploadSettingsPayload = {
  courseIntroMaxDurationMinutes: number;
  promotionalVideoMaxDurationMinutes: number;
};

function unwrap<T>(raw: unknown): T | null {
  if (!raw || typeof raw !== 'object') return null;
  const root = raw as Record<string, unknown>;
  const layer = root.data ?? root.Data ?? root;
  return (typeof layer === 'object' && layer !== null ? layer : root) as T;
}

function mapPayload(raw: Record<string, unknown> | null): MediaUploadSettingsPayload {
  return {
    courseIntroMaxDurationMinutes: Number(
      raw?.courseIntroMaxDurationMinutes ?? raw?.CourseIntroMaxDurationMinutes ?? 5
    ),
    promotionalVideoMaxDurationMinutes: Number(
      raw?.promotionalVideoMaxDurationMinutes ?? raw?.PromotionalVideoMaxDurationMinutes ?? 5
    ),
  };
}

const DEFAULTS: MediaUploadSettingsPayload = {
  courseIntroMaxDurationMinutes: 5,
  promotionalVideoMaxDurationMinutes: 5,
};

export async function getMediaUploadSettings(): Promise<MediaUploadSettingsPayload> {
  const res = await apiClient.get<unknown>('/MediaUploadSettings/Get');
  return { ...DEFAULTS, ...mapPayload(unwrap<Record<string, unknown>>(res.data)) };
}

export async function upsertMediaUploadSettings(payload: MediaUploadSettingsPayload): Promise<void> {
  await apiClient.post('/MediaUploadSettings/Upsert', {
    courseIntroMaxDurationMinutes: payload.courseIntroMaxDurationMinutes,
    promotionalVideoMaxDurationMinutes: payload.promotionalVideoMaxDurationMinutes,
  });
}
