import apiClient from '@/lib/apiClient';
import { getApiErrorMessage } from '@/lib/api-command-result';

export type CacheProvider = 'InMemory' | 'Redis';

export type CacheSettingsPayload = {
  isEnabled: boolean;
  provider: CacheProvider;
  defaultTtlMinutes: number;
  redisHost: string;
  redisPort: number;
  redisPassword?: string;
  hasRedisPassword?: boolean;
  redisInstanceName: string;
  redisUseSsl: boolean;
  cacheCoursesEnabled: boolean;
  cacheArticlesEnabled: boolean;
  cacheSeminarsEnabled: boolean;
  cacheBooksEnabled: boolean;
  cacheSoftwareEnabled: boolean;
  cacheTeacherAdsEnabled: boolean;
  cacheFilesEnabled: boolean;
  cacheCategoriesEnabled: boolean;
  cacheTeachersEnabled: boolean;
  cacheProjectsEnabled: boolean;
};

export type CacheWarmupProgress = {
  jobId: string;
  status: 'Idle' | 'Running' | 'Completed' | 'Failed' | string;
  percent: number;
  completedItems: number;
  totalItems: number;
  currentStep: string;
  error?: string | null;
  startedAtUtc?: string | null;
  finishedAtUtc?: string | null;
  updatedAtUtc?: string | null;
};

/** Defaults when no settings row exists yet — cache OFF so the site behaves normally. */
const DEFAULTS: CacheSettingsPayload = {
  isEnabled: false,
  provider: 'InMemory',
  defaultTtlMinutes: 30,
  redisHost: '127.0.0.1',
  redisPort: 6379,
  redisInstanceName: 'ArkaLearn:',
  redisUseSsl: false,
  cacheCoursesEnabled: true,
  cacheArticlesEnabled: true,
  cacheSeminarsEnabled: true,
  cacheBooksEnabled: true,
  cacheSoftwareEnabled: true,
  cacheTeacherAdsEnabled: true,
  cacheFilesEnabled: true,
  cacheCategoriesEnabled: true,
  cacheTeachersEnabled: true,
  cacheProjectsEnabled: true,
};

function unwrapSettingsPayload(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const root = raw as Record<string, unknown>;
  // Prefer the object that actually carries IsEnabled (avoid wrong nested wrappers).
  if ('isEnabled' in root || 'IsEnabled' in root) return root;
  const layer = root.data ?? root.Data ?? root.result ?? root.Result ?? root.queryResult ?? root.QueryResult;
  if (layer && typeof layer === 'object' && !Array.isArray(layer)) {
    const nested = layer as Record<string, unknown>;
    if ('isEnabled' in nested || 'IsEnabled' in nested) return nested;
    const deeper = nested.data ?? nested.Data;
    if (deeper && typeof deeper === 'object' && !Array.isArray(deeper)) {
      return deeper as Record<string, unknown>;
    }
    return nested;
  }
  return root;
}

/** Parse JSON booleans without coercing `false` via `?? true` / `Boolean("false")`. */
function readBool(raw: Record<string, unknown>, camel: string, pascal: string, fallback: boolean): boolean {
  const value = raw[camel] ?? raw[pascal];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
    if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
  }
  if (value == null) return fallback;
  return Boolean(value);
}

function readNumber(raw: Record<string, unknown>, camel: string, pascal: string, fallback: number): number {
  const value = raw[camel] ?? raw[pascal];
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function mapRow(raw: Record<string, unknown>): CacheSettingsPayload {
  const providerRaw = String(raw.provider ?? raw.Provider ?? 'InMemory');
  return {
    isEnabled: readBool(raw, 'isEnabled', 'IsEnabled', false),
    provider: providerRaw.toLowerCase() === 'redis' ? 'Redis' : 'InMemory',
    defaultTtlMinutes: Math.min(1440, Math.max(1, readNumber(raw, 'defaultTtlMinutes', 'DefaultTtlMinutes', 30))),
    redisHost: String(raw.redisHost ?? raw.RedisHost ?? '127.0.0.1'),
    redisPort: Math.min(65535, Math.max(1, readNumber(raw, 'redisPort', 'RedisPort', 6379))),
    hasRedisPassword: readBool(raw, 'hasRedisPassword', 'HasRedisPassword', false),
    redisInstanceName: String(raw.redisInstanceName ?? raw.RedisInstanceName ?? 'ArkaLearn:'),
    redisUseSsl: readBool(raw, 'redisUseSsl', 'RedisUseSsl', false),
    cacheCoursesEnabled: readBool(raw, 'cacheCoursesEnabled', 'CacheCoursesEnabled', true),
    cacheArticlesEnabled: readBool(raw, 'cacheArticlesEnabled', 'CacheArticlesEnabled', true),
    cacheSeminarsEnabled: readBool(raw, 'cacheSeminarsEnabled', 'CacheSeminarsEnabled', true),
    cacheBooksEnabled: readBool(raw, 'cacheBooksEnabled', 'CacheBooksEnabled', true),
    cacheSoftwareEnabled: readBool(raw, 'cacheSoftwareEnabled', 'CacheSoftwareEnabled', true),
    cacheTeacherAdsEnabled: readBool(raw, 'cacheTeacherAdsEnabled', 'CacheTeacherAdsEnabled', true),
    cacheFilesEnabled: readBool(raw, 'cacheFilesEnabled', 'CacheFilesEnabled', true),
    cacheCategoriesEnabled: readBool(raw, 'cacheCategoriesEnabled', 'CacheCategoriesEnabled', true),
    cacheTeachersEnabled: readBool(raw, 'cacheTeachersEnabled', 'CacheTeachersEnabled', true),
    cacheProjectsEnabled: readBool(raw, 'cacheProjectsEnabled', 'CacheProjectsEnabled', true),
  };
}

function mapWarmup(raw: unknown): CacheWarmupProgress {
  const row = unwrapSettingsPayload(raw);
  return {
    jobId: String(row.jobId ?? row.JobId ?? ''),
    status: String(row.status ?? row.Status ?? 'Idle'),
    percent: Math.min(100, Math.max(0, Number(row.percent ?? row.Percent ?? 0) || 0)),
    completedItems: Number(row.completedItems ?? row.CompletedItems ?? 0) || 0,
    totalItems: Number(row.totalItems ?? row.TotalItems ?? 0) || 0,
    currentStep: String(row.currentStep ?? row.CurrentStep ?? ''),
    error: (row.error ?? row.Error) != null ? String(row.error ?? row.Error) : null,
    startedAtUtc: (row.startedAtUtc ?? row.StartedAtUtc) as string | null | undefined,
    finishedAtUtc: (row.finishedAtUtc ?? row.FinishedAtUtc) as string | null | undefined,
    updatedAtUtc: (row.updatedAtUtc ?? row.UpdatedAtUtc) as string | null | undefined,
  };
}

export async function getCacheSettings(): Promise<CacheSettingsPayload> {
  try {
    const res = await apiClient.get<unknown>('/CacheSettings/Get');
    const row = unwrapSettingsPayload(res.data);
    return Object.keys(row).length > 0 ? mapRow(row) : { ...DEFAULTS };
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Could not load cache settings.'));
  }
}

export async function upsertCacheSettings(payload: CacheSettingsPayload): Promise<CacheSettingsPayload> {
  const enabled = payload.isEnabled === true;
  // Send both casings so binders / proxies cannot drop the flag.
  const body: Record<string, unknown> = {
    isEnabled: enabled,
    IsEnabled: enabled,
    provider: payload.provider,
    defaultTtlMinutes: payload.defaultTtlMinutes,
    redisHost: payload.redisHost,
    redisPort: payload.redisPort,
    redisInstanceName: payload.redisInstanceName,
    redisUseSsl: payload.redisUseSsl === true,
    cacheCoursesEnabled: payload.cacheCoursesEnabled === true,
    cacheArticlesEnabled: payload.cacheArticlesEnabled === true,
    cacheSeminarsEnabled: payload.cacheSeminarsEnabled === true,
    cacheBooksEnabled: payload.cacheBooksEnabled === true,
    cacheSoftwareEnabled: payload.cacheSoftwareEnabled === true,
    cacheTeacherAdsEnabled: payload.cacheTeacherAdsEnabled === true,
    cacheFilesEnabled: payload.cacheFilesEnabled === true,
    cacheCategoriesEnabled: payload.cacheCategoriesEnabled === true,
    cacheTeachersEnabled: payload.cacheTeachersEnabled === true,
    cacheProjectsEnabled: payload.cacheProjectsEnabled === true,
  };
  if (payload.redisPassword?.trim()) {
    body.redisPassword = payload.redisPassword.trim();
  }
  try {
    const res = await apiClient.post<unknown>('/CacheSettings/Upsert', body);
    const row = unwrapSettingsPayload(res.data);
    if ('isEnabled' in row || 'IsEnabled' in row) {
      return mapRow(row);
    }
    // Created(201) body should be settings; if not, trust the value we just saved.
    return { ...payload, isEnabled: enabled, redisPassword: undefined };
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Could not save cache settings.'));
  }
}

export async function startCacheWarmup(): Promise<CacheWarmupProgress> {
  try {
    const res = await apiClient.post<unknown>('/CacheSettings/StartWarmup');
    return mapWarmup(res.data);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Could not start cache warmup.'));
  }
}

export async function getCacheWarmupStatus(jobId?: string): Promise<CacheWarmupProgress> {
  try {
    const res = await apiClient.get<unknown>('/CacheSettings/WarmupStatus', {
      params: jobId ? { jobId } : undefined,
    });
    return mapWarmup(res.data);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Could not load warmup status.'));
  }
}

export { DEFAULTS as cacheSettingsDefaults };
