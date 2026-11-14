
export const API_PROXY_BASE_PATH = '/api/Service';
export const API_SERVICE_PATH = '/api/Service';

const DEFAULT_BACKEND_ORIGIN = 'https://api.arkasoftware.ir';
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || DEFAULT_BACKEND_ORIGIN;

export function normalizeApiHost(rawBaseUrl: string): string {
  const raw:string = rawBaseUrl.trim();
  if (!raw) return '';

  try {
    const url = new URL(raw);
    const normalizedPath:string = (url.pathname || '')
      .replace(/\/api(?:\/service)?\/?$/i, '')
      .replace(/\/+$/, '');

    return `${url.protocol}//${url.host}${normalizedPath}`;
  } catch {
    return raw.replace(/\/api(?:\/service)?\/?$/i, '').replace(/\/+$/, '');
  }
}

export function getBackendApiOrigin(): string {
  const origin = normalizeApiHost(BACKEND_URL) || DEFAULT_BACKEND_ORIGIN;
  // Node fetch on Windows may prefer IPv6 (::1) for localhost and fail when Kestrel listens on IPv4 only.
  if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
    return origin.replace('://localhost', '://127.0.0.1');
  }
  return origin;
}

export function getBackendServiceBaseUrl(): string {
  return `${getBackendApiOrigin()}${API_SERVICE_PATH}`;
}

// Server-side requests should use API host root.
// Browser-side requests stay relative and pass through Next.js proxy/rewrite.
export const API_BASE_URL: string =
    typeof window === 'undefined'
        ? getBackendServiceBaseUrl()
        : API_PROXY_BASE_PATH; // مرورگر همیشه از same-origin proxy استفاده می‌کند تا CORS نخوریم.

export const isApiConfigured:() => boolean = ():boolean => Boolean(getBackendApiOrigin());
