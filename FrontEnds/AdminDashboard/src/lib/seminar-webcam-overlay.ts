import type { WebcamOverlaySettings, ImageSettings } from '@/components/seminar/seminar-settings-dialog';

/** Style payload synced with webcam overlay geometry over SignalR. */
export type WebcamOverlayStylePayload = Pick<
  WebcamOverlaySettings,
  'shape' | 'cornerRadius' | 'borderWidth' | 'borderColor' | 'shadow' | 'shadowColor'
> &
  Partial<Pick<ImageSettings, 'brightness' | 'contrast' | 'touchUp'>>;

export function serializeWebcamOverlayStyle(style: WebcamOverlayStylePayload): string {
  return JSON.stringify(style);
}

export function parseWebcamOverlayStyle(raw: unknown): WebcamOverlayStylePayload | null {
  if (raw == null || raw === '') return null;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== 'object') return null;
    const o = parsed as Record<string, unknown>;
    const shape = o.shape === 'circle' || o.shape === 'square' ? o.shape : undefined;
    if (!shape) return null;
    return {
      shape,
      cornerRadius: typeof o.cornerRadius === 'number' ? o.cornerRadius : 8,
      borderWidth: typeof o.borderWidth === 'number' ? o.borderWidth : 2,
      borderColor: typeof o.borderColor === 'string' ? o.borderColor : '#ffffff',
      shadow: typeof o.shadow === 'boolean' ? o.shadow : true,
      shadowColor: typeof o.shadowColor === 'string' ? o.shadowColor : '#00000080',
      brightness: typeof o.brightness === 'number' ? o.brightness : undefined,
      contrast: typeof o.contrast === 'number' ? o.contrast : undefined,
      touchUp: typeof o.touchUp === 'boolean' ? o.touchUp : undefined,
    };
  } catch {
    return null;
  }
}
