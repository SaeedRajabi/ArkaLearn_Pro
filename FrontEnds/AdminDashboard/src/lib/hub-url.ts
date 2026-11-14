import { getBackendApiOrigin } from '@/lib/api-config';

function normalizeLoopbackHost(host: string): string {
  return host.toLowerCase() === 'localhost' ? '127.0.0.1' : host.toLowerCase();
}

export function isLocalBackendApi(): boolean {
  return /localhost|127\.0\.0\.1/i.test(getBackendApiOrigin());
}

/** True when the dashboard page and API share the same origin (host/port/protocol). */
export function isSameOriginAsBackend(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const backend = new URL(getBackendApiOrigin());
    const page = window.location;
    const backendPort = backend.port || (backend.protocol === 'https:' ? '443' : '80');
    const pagePort = page.port || (page.protocol === 'https:' ? '443' : '80');

    return (
      normalizeLoopbackHost(backend.hostname) === normalizeLoopbackHost(page.hostname) &&
      backendPort === pagePort &&
      backend.protocol === page.protocol
    );
  } catch {
    return false;
  }
}

export function resolveHubUrl(
  hubPath: string,
  options?: {
    directEnvKey?: string;
    proxyEnvKey?: string;
  }
): string {
  const backendHub = `${getBackendApiOrigin()}${hubPath}`;

  if (typeof window === 'undefined') {
    return backendHub;
  }

  const forceDirect =
    (options?.directEnvKey && process.env[options.directEnvKey] === '1') ||
    process.env.NEXT_PUBLIC_HUB_DIRECT === '1';
  if (forceDirect) return backendHub;

  const forceProxy =
    (options?.proxyEnvKey && process.env[options.proxyEnvKey] === '1') ||
    process.env.NEXT_PUBLIC_HUB_PROXY === '1';
  if (forceProxy) return `${window.location.origin}${hubPath}`;

  // Browser + different origin (e.g. dashboard :4001 vs API :5001): same-origin proxy + LongPolling.
  if (!isSameOriginAsBackend()) {
    return `${window.location.origin}${hubPath}`;
  }

  if (process.env.NODE_ENV === 'development' && isLocalBackendApi()) {
    return backendHub;
  }

  return `${window.location.origin}${hubPath}`;
}

export function isProxiedHubUrl(hubUrl: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return new URL(hubUrl).origin === window.location.origin;
  } catch {
    return hubUrl.startsWith('/');
  }
}
