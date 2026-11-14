const DEFAULT_API_SERVICE_BASE_URL = 'https://api.arkasoftware.ir/api/Service';
const PROD_STATIC_HOST_FALLBACK = 'https://msg.arkasoftware.ir';

function trimLeadingSlashes(value: string): string {
  return value.replace(/^\/+/, '');
}

function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '') || '/';
}

function isAbsoluteHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function isInlineOrBlobUrl(value: string): boolean {
  return /^(data:|blob:)/i.test(value);
}

function hasMediaFileExtension(value: string): boolean {
  return /\.(png|jpe?g|webp|gif|svg|avif|mp4|webm|mov|m4v)(?:$|[?#])/i.test(value);
}

function normalizeApiAssetPath(assetPath: string): string {
  let normalized = assetPath.replace(/\\/g, '/').trim();
  if (!normalized) return '';
  if (!normalized.startsWith('/')) normalized = `/${normalized}`;

  // Static media lives under wwwroot and should not include /api in the final URL.
  normalized = normalized.replace(/^\/api\/(?=(?:images|videos|seminars|rooms)\b)/i, '/api/');

  // Normalize legacy singular static folders.
  normalized = normalized
    .replace(/^\/images\/article\//i, '/images/articles/')
    .replace(/^\/images\/course\//i, '/images/courses/')
    .replace(/^\/images\/usersprofile\//i, '/images/usersProfile/')
    .replace(/^\/Images\/usersprofile\//i, '/Images/usersProfile/');

  // Normalize legacy controller image paths to static folders.
  const controllerRouteMatch = normalized.match(/^\/api\/(?:api\/)?(article|course|seminar)s?\/(.+)$/i);
  if (controllerRouteMatch) {
    const controllerName = controllerRouteMatch[1].toLowerCase();
    const filePart = controllerRouteMatch[2];
    if (hasMediaFileExtension(filePart)) {
      if (controllerName === 'article') return `/images/articles/${filePart}`;
      if (controllerName === 'course') return `/images/courses/${filePart}`;
      return `/seminars/image/${filePart}`;
    }
  }

  return normalized;
}

// function stripApiServiceSuffix(value: string): string {
//   return value.replace(/\/api(?:\/api)?\/Service\/?$/i, '') || '/';
// }

function normalizeStaticBaseUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  if (isAbsoluteHttpUrl(trimmed)) {
    try {
      const url = new URL(trimmed);
      const staticPath = trimTrailingSlashes(url.pathname || '/');
      return `${url.origin}${staticPath === '/' ? '' : staticPath}`;
    } catch {
      return trimTrailingSlashes(trimmed);
    }
  }

  return trimTrailingSlashes(trimmed);
}

function normalizeApiServicePath(pathLike: string): string {
  let normalized = trimTrailingSlashes(pathLike).replace(/\/api\/api\/service$/i, '/api/Service');

  if (/\/api\/service$/i.test(normalized)) return normalized;
  if (/\/api$/i.test(normalized)) return `${normalized}/Service`;
  if (normalized === '/') return DEFAULT_API_SERVICE_BASE_URL;

  return `${normalized}/${trimLeadingSlashes(DEFAULT_API_SERVICE_BASE_URL)}`;
}

function ensureApiServiceBaseUrl(value: string): string {
  const normalized:string = value.trim(); //collapseDuplicateApiServiceSegments(value.trim());

  if (isAbsoluteHttpUrl(normalized)) {
    try {
      const url = new URL(normalized);
      //const servicePath = normalizeApiServicePath(url.pathname || '/');
      return `${url.origin}${url.pathname === '/' ? '' : url.pathname}`;
    } catch {
      // fall through to relative handling
    }
  }

  return normalized; //normalizeApiServicePath(normalized);
}

/** Build `http://host:port/api/Service` from an env URL (handles `/`, `/api`, `/api/Service`). */
function toAbsoluteApiServiceBase(url: URL): string {
  const origin = url.origin;
  let path = url.pathname.replace(/\/+$/, '') || '/';
  const lower = path.toLowerCase();
  if (lower === '/api/service' || lower.endsWith('/api/service')) {
    path = '/api/Service';
  } else if (lower === '/api' || lower.endsWith('/api')) {
    path = `${path.replace(/\/+$/, '')}/Service`.replace(/\/+/g, '/');
  } else if (path === '/' || path === '') {
    path = '/api/Service';
  } else if (!lower.includes('/api/service')) {
    path = `${path.replace(/\/+$/, '')}/api/Service`.replace(/\/+/g, '/');
  }
  return `${origin}${path}`;
}

/** Same-origin path used by the browser; Next.js rewrites / route handlers proxy to the real API. */
export const CLIENT_API_PROXY_PATH = '/svc/Service';

export function getApiServiceBaseUrl(): string {
  // Browser must never call api.arkasoftware.ir or localhost:500x directly (CORS / self-signed HTTPS).
  if (typeof window !== 'undefined') {
    return CLIENT_API_PROXY_PATH;
  }

  const envValue = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!envValue) return DEFAULT_API_SERVICE_BASE_URL;

  return ensureApiServiceBaseUrl(envValue);
}

/** Backend host (no path). Used for SignalR and static assets. */
export function getBackendApiOrigin(): string {
  const defaultOrigin =
    process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://api.arkasoftware.ir';

  const raw =
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    process.env.API_URL?.trim() ||
    defaultOrigin;

  try {
    const normalized = raw.includes('://') ? raw : `https://${raw}`;
    return new URL(normalized).origin;
  } catch {
    return defaultOrigin;
  }
}

import { isProxiedHubUrl, resolveHubUrl } from '@/lib/hub-url';

/**
 * MeetingHub URL selection strategy:
 * - Dev + local API: direct backend hub (avoids broken negotiate proxy during local HTTPS dev).
 * - Production browser: same-origin dashboard proxy (/meetingHub).
 * - Override with NEXT_PUBLIC_MEETING_HUB_DIRECT=1 or NEXT_PUBLIC_MEETING_HUB_PROXY=1.
 */
export function getMeetingHubUrl(): string {
  return resolveHubUrl('/meetingHub', {
    directEnvKey: 'NEXT_PUBLIC_MEETING_HUB_DIRECT',
    proxyEnvKey: 'NEXT_PUBLIC_MEETING_HUB_PROXY',
  });
}

/** Use LongPolling when the hub URL is proxied (Next.js cannot upgrade WebSockets). */
export function isProxiedMeetingHubUrl(hubUrl: string): boolean {
  return isProxiedHubUrl(hubUrl);
}

export function getSeminarIntroStreamUrl(seminarId: string | number): string {
  const id = encodeURIComponent(String(seminarId));
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/svc/Service/Seminar/StreamIntro?seminarId=${id}`;
  }
  return `${getBackendApiOrigin()}/api/Service/Seminar/StreamIntro?seminarId=${id}`;
}

export function getSeminarRecordingStreamUrl(seminarId: string | number): string {
  const id = encodeURIComponent(String(seminarId));
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/svc/Service/Seminar/StreamRecording?seminarId=${id}`;
  }
  return `${getBackendApiOrigin()}/api/Service/Seminar/StreamRecording?seminarId=${id}`;
}

export {
  getWebRtcIceServers,
  getWebRtcPeerConnectionConfig,
  isTurnConfigured,
  EXAMPLE_TURN_ICE_SERVER,
} from './webrtc-ice-config';

export function getStaticBaseUrl(): string {
  const explicitMsgOrStatic =
    process.env.NEXT_PUBLIC_STATIC_ASSET_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_STATIC_BASE_URL?.trim();
  if (explicitMsgOrStatic) return normalizeStaticBaseUrl(explicitMsgOrStatic);

  if (typeof window !== 'undefined') {
    // Browser: prefer same-origin only when no explicit static host is configured.
    // Production should set NEXT_PUBLIC_STATIC_ASSET_BASE_URL=https://msg.arkasoftware.ir
  }

  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    return window.location.origin;
  }

  const explicitBackendBaseUrl =
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim();
  if (explicitBackendBaseUrl) return normalizeStaticBaseUrl(explicitBackendBaseUrl);

  if (process.env.NODE_ENV === 'production') {
    return PROD_STATIC_HOST_FALLBACK;
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  const apiServiceBaseUrl = getApiServiceBaseUrl();

  if (isAbsoluteHttpUrl(apiServiceBaseUrl)) {
    try {
      const url = new URL(apiServiceBaseUrl);
      const staticPath = trimTrailingSlashes(url.pathname);
      return `${url.origin}${staticPath === '/' ? '' : staticPath}`;
    } catch {
      return trimTrailingSlashes(apiServiceBaseUrl);
    }
  }

  const staticPath = trimTrailingSlashes(apiServiceBaseUrl);
  return staticPath === '/' ? '' : staticPath;
}

function normalizeStaticAssetPath(assetUrl: string): string {
  let normalized = assetUrl.trim().replace(/\\/g, '/');
  if (!normalized) return '';

  const webRootIndex = normalized.toLowerCase().indexOf('/wwwroot/');
  if (webRootIndex >= 0) {
    normalized = normalized.slice(webRootIndex + '/wwwroot'.length);
  } else {
    normalized = normalized.replace(/^\/?wwwroot(?=\/|$)/i, '');
  }

  return normalizeApiAssetPath(normalized);
}

function stripDuplicateStaticBasePath(assetPath: string, staticBaseUrl: string): string {
  if (!assetPath.startsWith('/')) return assetPath;

  let basePath = staticBaseUrl;
  if (isAbsoluteHttpUrl(staticBaseUrl)) {
    try {
      basePath = new URL(staticBaseUrl).pathname || '/';
    } catch {
      basePath = '/';
    }
  }

  const normalizedBasePath = trimTrailingSlashes(basePath || '/');
  if (normalizedBasePath === '/') return assetPath;

  return assetPath.toLowerCase().startsWith(`${normalizedBasePath.toLowerCase()}/`)
    ? (assetPath.slice(normalizedBasePath.length) || '/')
    : assetPath;
}

export function resolveStaticAssetUrl(assetUrl?: string | null): string {
  if (!assetUrl) return '';

  const raw = String(assetUrl).trim();
  if (!raw) return '';
  if (isInlineOrBlobUrl(raw)) return raw;

  if (isAbsoluteHttpUrl(raw)) {
    try {
      const parsed = new URL(raw);
      const normalizedAbsolutePath = normalizeStaticAssetPath(parsed.pathname);
      if (/^\/(?:api\/)?(?:public\/)?(?:images|videos|seminars|rooms|media|audio)\b/i.test(normalizedAbsolutePath)) {
        const staticBaseUrl = getStaticBaseUrl();
        if (!staticBaseUrl) return normalizedAbsolutePath;
        const safePath = toMsgPublicPathIfNeeded(
          stripDuplicateStaticBasePath(normalizedAbsolutePath, staticBaseUrl),
          staticBaseUrl,
        );
        return `${trimTrailingSlashes(staticBaseUrl)}${safePath.startsWith('/') ? '' : '/'}${safePath}`;
      }
    } catch {
      // fall back to raw
    }
    return raw;
  }

  const normalizedPath = normalizeStaticAssetPath(raw);
  const staticBaseUrl = getStaticBaseUrl();
  if (!staticBaseUrl) return normalizedPath;

  const safePath = toMsgPublicPathIfNeeded(
    stripDuplicateStaticBasePath(normalizedPath, staticBaseUrl),
    staticBaseUrl,
  );
  return `${trimTrailingSlashes(staticBaseUrl)}${safePath.startsWith('/') ? '' : '/'}${safePath}`;
}

function toMsgPublicPathIfNeeded(assetPath: string, staticBaseUrl: string): string {
  if (!assetPath.startsWith('/')) return assetPath;
  if (/^\/(?:public|private|drm)\//i.test(assetPath)) return assetPath;
  let host = '';
  try {
    host = new URL(staticBaseUrl).hostname.toLowerCase();
  } catch {
    return assetPath;
  }
  if (host !== 'msg.arkasoftware.ir' && !host.startsWith('msg.')) return assetPath;
  if (/^\/(?:images|videos|seminars|rooms|users|projects|files|media|audio)\//i.test(assetPath))
    return `/public${assetPath}`;
  return assetPath;
}

/** Normalize media URLs for browser preview (same-origin relative paths when possible). */
export function toSameOriginAssetSrc(value?: string | File | null): string | null {
  if (!value) return null;
  if (value instanceof File) return URL.createObjectURL(value);
  if (typeof value !== 'string' || !value.trim()) return null;

  const trimmed = value.trim();
  if (trimmed.toLowerCase().startsWith('drm://')) return null;

  const resolved = resolveStaticAssetUrl(trimmed);
  if (!resolved) return null;

  // Never strip a different origin down to a pathname — that breaks admin previews
  // (admin host != msg static host) for /media and /videos intros.
  if (typeof window !== 'undefined') {
    try {
      const absolute = new URL(resolved, window.location.origin);
      if (absolute.origin === window.location.origin) {
        return absolute.pathname + absolute.search + absolute.hash;
      }
      return absolute.toString();
    } catch {
      /* keep resolved */
    }
  }

  return resolved;
}




//
// export function getApiServiceBaseUrl(): string {
//   const env = process.env.NEXT_PUBLIC_API_BASE_URL;
//
//   if (!env) return DEFAULT_API_BASE;
//
//   return trimSlash(env);
// }
//
// export function getStaticBaseUrl(): string {
//   const env = process.env.NEXT_PUBLIC_STATIC_BASE_URL;
//
//   if (env) return trimSlash(env);
//
//   const apiBase = getApiServiceBaseUrl();
//
//   if (isAbsoluteUrl(apiBase)) {
//     const url = new URL(apiBase);
//     return url.origin;
//   }
//
//   if (typeof window !== 'undefined') {
//     return window.location.origin;
//   }
//
//   return DEFAULT_STATIC_BASE;
// }
//
// export function resolveStaticAssetUrl(assetUrl?: string | null): string {
//   if (!assetUrl) return '';
//
//   const url = assetUrl.trim();
//
//   if (!url) return '';
//
//   if (/^(http|data:|blob:)/i.test(url)) return url;
//
//   const base = getStaticBaseUrl();
//
//   const normalized = url.startsWith('/') ? url : `/${url}`;
//
//   return `${trimSlash(base)}${normalized}`;
// }
