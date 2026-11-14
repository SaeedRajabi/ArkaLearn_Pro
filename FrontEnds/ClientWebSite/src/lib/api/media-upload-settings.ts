import { apiRequest } from './client';

export type MediaUploadSettings = {
  courseIntroMaxDurationMinutes: number;
  promotionalVideoMaxDurationMinutes: number;
};

const DEFAULTS: MediaUploadSettings = {
  courseIntroMaxDurationMinutes: 5,
  promotionalVideoMaxDurationMinutes: 5,
};

export async function getMediaUploadSettings(): Promise<MediaUploadSettings> {
  const raw = await apiRequest<unknown>('MediaUploadSettings/Get');
  if (!raw || typeof raw !== 'object') return DEFAULTS;

  const root = raw as Record<string, unknown>;
  const layer = root.data ?? root.Data ?? root;
  const value = layer && typeof layer === 'object' ? layer as Record<string, unknown> : root;
  return {
    courseIntroMaxDurationMinutes: Number(
      value.courseIntroMaxDurationMinutes ?? value.CourseIntroMaxDurationMinutes ?? 5
    ),
    promotionalVideoMaxDurationMinutes: Number(
      value.promotionalVideoMaxDurationMinutes ?? value.PromotionalVideoMaxDurationMinutes ?? 5
    ),
  };
}
