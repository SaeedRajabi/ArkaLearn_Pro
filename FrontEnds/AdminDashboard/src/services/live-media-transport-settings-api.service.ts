import apiClient from '@/lib/apiClient';

export type LiveMediaTransportMode = 'Mesh' | 'LiveKit';

export type LiveMediaTransportSettingsPayload = {
  transportMode: LiveMediaTransportMode;
  liveKitUrl: string;
  liveKitApiKey: string;
  liveKitApiSecret: string;
  hasLiveKitApiSecret: boolean;
  turnUrl: string;
  turnUsername: string;
  /** Empty string clears; undefined keeps the stored credential. */
  turnPassword?: string;
  hasTurnPassword: boolean;
  stunUrls: string;
};

export type LiveMediaRuntimeConfig = {
  transportMode: LiveMediaTransportMode;
  liveKitUrl: string | null;
  isLiveKitReady: boolean;
  /** Admin-managed TURN/STUN for the mesh (null when not configured). */
  turnUrls: string | null;
  turnUsername: string | null;
  turnPassword: string | null;
  stunUrls: string | null;
};

export type LiveKitTokenResponse = {
  token: string;
  url: string;
  roomName: string;
  identity: string;
};

/** تفاوت پاسخ مستقیم و پوشش data/Data بک‌اند را برای نگاشت بعدی یکسان می‌کند. */
function unwrap<T>(raw: unknown): T | null {
  if (!raw || typeof raw !== 'object') return null;
  const root = raw as Record<string, unknown>;
  const layer = root.data ?? root.Data ?? root;
  return (typeof layer === 'object' && layer !== null ? layer : root) as T;
}

/** نام‌گذاری camelCase/PascalCase را می‌پذیرد؛ فرم رمز واقعی ذخیره‌شده را دریافت نمی‌کند. */
function mapSettings(raw: Record<string, unknown> | null): LiveMediaTransportSettingsPayload {
  const modeRaw = String(raw?.transportMode ?? raw?.TransportMode ?? 'Mesh');
  const mode: LiveMediaTransportMode =
    modeRaw.toLowerCase() === 'livekit' ? 'LiveKit' : 'Mesh';
  return {
    transportMode: mode,
    liveKitUrl: String(raw?.liveKitUrl ?? raw?.LiveKitUrl ?? ''),
    liveKitApiKey: String(raw?.liveKitApiKey ?? raw?.LiveKitApiKey ?? ''),
    liveKitApiSecret: '',
    hasLiveKitApiSecret: Boolean(raw?.hasLiveKitApiSecret ?? raw?.HasLiveKitApiSecret ?? false),
    turnUrl: String(raw?.turnUrl ?? raw?.TurnUrl ?? ''),
    turnUsername: String(raw?.turnUsername ?? raw?.TurnUsername ?? ''),
    hasTurnPassword: Boolean(raw?.hasTurnPassword ?? raw?.HasTurnPassword ?? false),
    stunUrls: String(raw?.stunUrls ?? raw?.StunUrls ?? ''),
  };
}

const DEFAULTS: LiveMediaTransportSettingsPayload = {
  transportMode: 'Mesh',
  liveKitUrl: '',
  liveKitApiKey: '',
  liveKitApiSecret: '',
  hasLiveKitApiSecret: false,
  turnUrl: '',
  turnUsername: '',
  hasTurnPassword: false,
  stunUrls: '',
};

/** داده اولیه فرم مدیر را با پیش‌فرض‌های فیلدهای غایب می‌گیرد. */
export async function getLiveMediaTransportSettings(): Promise<LiveMediaTransportSettingsPayload> {
  const res = await apiClient.get<unknown>('/LiveMediaTransportSettings/Get');
  return { ...DEFAULTS, ...mapSettings(unwrap<Record<string, unknown>>(res.data)) };
}

/**
 * تنظیمات فرم را ذخیره می‌کند. رمز خالی LiveKit در این کلاینت به null (حفظ رمز قبلی) تبدیل می‌شود.
 * برای TURN، undefined فیلد را نمی‌فرستد، رشته خالی رمز را پاک می‌کند و مقدار جدید جایگزین می‌شود.
 */
export async function upsertLiveMediaTransportSettings(
  payload: LiveMediaTransportSettingsPayload
): Promise<void> {
  const body: Record<string, unknown> = {
    transportMode: payload.transportMode,
    liveKitUrl: payload.liveKitUrl || null,
    liveKitApiKey: payload.liveKitApiKey || null,
    turnUrl: payload.turnUrl || null,
    turnUsername: payload.turnUsername || null,
    stunUrls: payload.stunUrls || null,
  };
  // null = keep existing secret; empty string clears; non-empty sets new.
  if (payload.liveKitApiSecret.trim().length > 0) {
    body.liveKitApiSecret = payload.liveKitApiSecret.trim();
  } else {
    body.liveKitApiSecret = null;
  }
  if (payload.turnPassword !== undefined) {
    body.turnPassword = payload.turnPassword.trim().length > 0 ? payload.turnPassword.trim() : '';
  }
  await apiClient.post('/LiveMediaTransportSettings/Upsert', body);
}

/**
 * تنظیمات لازم ورود کلاس را می‌گیرد؛ رمز TURN برای استفاده ICE مرورگر در پاسخ وجود دارد.
 * هر خطای دریافت فعلاً به Mesh بدون تنظیم runtime تبدیل می‌شود؛ این fallback ممکن است خطای API را پنهان کند.
 */
export async function getLiveMediaRuntimeConfig(): Promise<LiveMediaRuntimeConfig> {
  try {
    const res = await apiClient.get<unknown>('/LiveMediaTransportSettings/GetRuntimeConfig');
    const raw = unwrap<Record<string, unknown>>(res.data) ?? {};
    const modeRaw = String(raw.transportMode ?? raw.TransportMode ?? 'Mesh');
    const mode: LiveMediaTransportMode =
      modeRaw.toLowerCase() === 'livekit' ? 'LiveKit' : 'Mesh';
    return {
      transportMode: mode,
      liveKitUrl: (raw.liveKitUrl ?? raw.LiveKitUrl ?? null) as string | null,
      isLiveKitReady: Boolean(raw.isLiveKitReady ?? raw.IsLiveKitReady ?? false),
      turnUrls: (raw.turnUrls ?? raw.TurnUrls ?? null) as string | null,
      turnUsername: (raw.turnUsername ?? raw.TurnUsername ?? null) as string | null,
      turnPassword: (raw.turnPassword ?? raw.TurnPassword ?? null) as string | null,
      stunUrls: (raw.stunUrls ?? raw.StunUrls ?? null) as string | null,
    };
  } catch {
    return {
      transportMode: 'Mesh',
      liveKitUrl: null,
      isLiveKitReady: false,
      turnUrls: null,
      turnUsername: null,
      turnPassword: null,
      stunUrls: null,
    };
  }
}

/** توکن ورود اتاق و آدرس اتصال SFU را از بک‌اند می‌گیرد؛ این تابع خود به SFU وصل نمی‌شود. */
export async function createLiveKitToken(input: {
  roomName: string;
  identity: string;
  displayName?: string;
  canPublish?: boolean;
}): Promise<LiveKitTokenResponse> {
  const res = await apiClient.post<unknown>('/LiveMediaTransportSettings/CreateLiveKitToken', {
    roomName: input.roomName,
    identity: input.identity,
    displayName: input.displayName,
    canPublish: input.canPublish,
  });
  const raw = unwrap<Record<string, unknown>>(res.data) ?? {};
  return {
    token: String(raw.token ?? raw.Token ?? ''),
    url: String(raw.url ?? raw.Url ?? ''),
    roomName: String(raw.roomName ?? raw.RoomName ?? input.roomName),
    identity: String(raw.identity ?? raw.Identity ?? input.identity),
  };
}
