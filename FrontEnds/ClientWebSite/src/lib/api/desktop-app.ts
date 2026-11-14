import { apiRequest } from './client';

const BASE = 'DesktopApp';

export type DesktopAppUpdateInfo = {
  updateAvailable: boolean;
  isMandatory: boolean;
  latestVersion: string | null;
  installerUrl: string | null;
  releaseNotes: string | null;
  minSupportedVersion: string | null;
};

function unwrapPayload(payload: unknown): Record<string, unknown> | null {
  let cur: unknown = payload;
  for (let depth = 0; depth < 8; depth++) {
    if (!cur || typeof cur !== 'object' || Array.isArray(cur)) return null;
    const obj = cur as Record<string, unknown>;
    if (
      'installerUrl' in obj ||
      'InstallerUrl' in obj ||
      'latestVersion' in obj ||
      'LatestVersion' in obj ||
      'updateAvailable' in obj ||
      'UpdateAvailable' in obj
    ) {
      return obj;
    }
    const next = obj.data ?? obj.Data ?? obj.queryResult ?? obj.QueryResult ?? obj.result ?? obj.Result;
    if (next === cur) break;
    cur = next;
  }
  return null;
}

function normalize(raw: Record<string, unknown>): DesktopAppUpdateInfo {
  const installerUrl = String(raw.installerUrl ?? raw.InstallerUrl ?? '').trim() || null;
  const latestVersion = String(raw.latestVersion ?? raw.LatestVersion ?? '').trim() || null;
  return {
    updateAvailable: Boolean(raw.updateAvailable ?? raw.UpdateAvailable ?? !!installerUrl),
    isMandatory: Boolean(raw.isMandatory ?? raw.IsMandatory ?? false),
    latestVersion,
    installerUrl,
    releaseNotes: String(raw.releaseNotes ?? raw.ReleaseNotes ?? '').trim() || null,
    minSupportedVersion: String(raw.minSupportedVersion ?? raw.MinSupportedVersion ?? '').trim() || null,
  };
}

/** Public: latest published Windows installer (omit version ≈ treat as 0.0.0). */
export async function checkDesktopAppUpdate(
  currentVersion = '0.0.0'
): Promise<DesktopAppUpdateInfo | null> {
  try {
    const qs = currentVersion ? `?currentVersion=${encodeURIComponent(currentVersion)}` : '';
    const raw = await apiRequest<unknown>(`${BASE}/CheckUpdate${qs}`, {
      method: 'GET',
      timeoutMs: 12000,
    });
    const layer = unwrapPayload(raw);
    if (!layer) return null;
    return normalize(layer);
  } catch {
    return null;
  }
}

export async function getLatestDesktopInstallerUrl(): Promise<string | null> {
  const info = await checkDesktopAppUpdate('0.0.0');
  return info?.installerUrl ?? null;
}
