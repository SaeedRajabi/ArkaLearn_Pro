const PROD_API_HOST = 'api.arkasoftware.ir';
const PROD_MSG_HOST = 'msg.arkasoftware.ir';
const PROD_SITE_HOST = 'arkasoftware.ir';

function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '');
}

function getAllowedRemoteHosts(): Set<string> {
  const hosts = new Set<string>([
    PROD_API_HOST,
    PROD_MSG_HOST,
    PROD_SITE_HOST,
    `www.${PROD_SITE_HOST}`,
    'localhost',
    '127.0.0.1',
  ]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (apiUrl) {
    try {
      hosts.add(new URL(apiUrl).hostname.toLowerCase());
    } catch {
      // ignore invalid env
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (siteUrl) {
    try {
      hosts.add(new URL(siteUrl).hostname.toLowerCase());
    } catch {
      // ignore invalid env
    }
  }

  const staticAssetBase = process.env.NEXT_PUBLIC_STATIC_ASSET_BASE_URL?.trim();
  if (staticAssetBase) {
    try {
      hosts.add(new URL(staticAssetBase).hostname.toLowerCase());
    } catch {
      // ignore invalid env
    }
  }

  return hosts;
}

/** Hosts that already serve assets (API wwwroot or msg storage) — fetch absolute URLs as-is. */
export function isDirectAssetHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === PROD_API_HOST || host === PROD_MSG_HOST) return true;
  if (host.startsWith('msg.')) return true;

  const staticAssetBase = process.env.NEXT_PUBLIC_STATIC_ASSET_BASE_URL?.trim();
  if (staticAssetBase) {
    try {
      if (new URL(staticAssetBase).hostname.toLowerCase() === host) return true;
    } catch {
      // ignore
    }
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (apiUrl) {
    try {
      if (new URL(apiUrl).hostname.toLowerCase() === host) return true;
    } catch {
      // ignore
    }
  }

  return false;
}

function isAllowedRemoteUrl(url: URL): boolean {
  const hosts = getAllowedRemoteHosts();
  if (!hosts.has(url.hostname.toLowerCase())) return false;
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  return true;
}

function isAllowedLocalPath(path: string): boolean {
  if (!path.startsWith('/')) return false;
  if (path.startsWith('//')) return false;
  if (path.includes('..')) return false;
  if (path.startsWith('/api/')) return false;
  return true;
}

export function resolveImageSource(rawUrl: string, requestOrigin: string): URL | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('/')) {
    if (!isAllowedLocalPath(trimmed)) return null;
    return new URL(trimmed, requestOrigin);
  }

  try {
    const absolute = new URL(trimmed);
    if (!isAllowedRemoteUrl(absolute)) return null;
    return absolute;
  } catch {
    return null;
  }
}

export function clampImageDimension(value: number | null, fallback: number, max: number): number {
  if (value == null || Number.isNaN(value)) return fallback;
  return Math.min(Math.max(Math.round(value), 16), max);
}

export function clampQuality(value: number | null, fallback = 75): number {
  if (value == null || Number.isNaN(value)) return fallback;
  return Math.min(Math.max(Math.round(value), 40), 90);
}

export function normalizeBackendOrigin(rawBase: string): string {
  const raw = rawBase.trim();
  if (!raw) return `https://${PROD_API_HOST}`;

  try {
    const url = new URL(raw);
    const normalizedPath = trimTrailingSlashes((url.pathname || '').replace(/\/api(?:\/service)?\/?$/i, ''));
    return `${url.protocol}//${url.host}${normalizedPath && normalizedPath !== '/' ? normalizedPath : ''}`;
  } catch {
    return trimTrailingSlashes(raw.replace(/\/api(?:\/service)?\/?$/i, ''));
  }
}

export function getBackendAssetOrigin(requestOrigin: string): string {
  const explicit = process.env.NEXT_PUBLIC_STATIC_ASSET_BASE_URL?.trim();
  if (explicit) return normalizeBackendOrigin(explicit);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (apiUrl) return normalizeBackendOrigin(apiUrl);

  if (process.env.NODE_ENV === 'production') {
    return `https://${PROD_MSG_HOST}`;
  }

  return requestOrigin;
}
