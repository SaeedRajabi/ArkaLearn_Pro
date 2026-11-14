import { NextRequest } from 'next/server';
import { getBackendApiOrigin } from '@/lib/api-config';

function ensureLocalTlsRelaxed(): void {
  if (process.env.ARKA_RELAX_LOCAL_TLS === '0') return;
  if (/localhost|127\.0\.0\.1/i.test(getBackendApiOrigin())) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
}

/** Node on Windows often resolves localhost to ::1 while Kestrel only listens on IPv4. */
function normalizeLoopbackHost(urlString: string): string {
  try {
    const url = new URL(urlString);
    if (url.hostname === 'localhost') {
      url.hostname = '127.0.0.1';
      return url.toString();
    }
  } catch {
    /* keep original */
  }
  return urlString;
}

function isLocalBackendUrl(urlString: string): boolean {
  try {
    const host = new URL(urlString).hostname.toLowerCase();
    return host === 'localhost' || host === '127.0.0.1';
  } catch {
    return false;
  }
}

function isConnectFailure(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const code = (error as Error & { code?: string }).code;
  if (code === 'UND_ERR_CONNECT_TIMEOUT' || code === 'ECONNREFUSED' || code === 'ETIMEDOUT') {
    return true;
  }
  const cause = (error as Error & { cause?: unknown }).cause;
  if (cause instanceof Error) return isConnectFailure(cause);
  return /connect timeout|ECONNREFUSED|ETIMEDOUT/i.test(error.message);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Allow ASP.NET dev certificate (self-signed) when proxying to https://localhost in development. */
if (process.env.NODE_ENV === 'development') {
  ensureLocalTlsRelaxed();
}

export const proxyRuntime = 'nodejs';
export const proxyDynamic = 'force-dynamic';

const DEFAULT_API_SERVICE_BASE_URL = 'https://api.arkasoftware.ir/api/Service';

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
  'expect',
]);

/** Node fetch decompresses gzip/br bodies; forwarding these headers breaks browsers (ERR_CONTENT_DECODING_FAILED). */
const STRIP_FROM_PROXY_RESPONSE = new Set([
  ...HOP_BY_HOP_HEADERS,
  'content-encoding',
]);

export type ProxyRouteContext = {
  params: Promise<{
    path?: string[];
  }>;
};

function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '');
}

export function getBackendServiceBaseUrl(): string {
  const raw =
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    DEFAULT_API_SERVICE_BASE_URL;

  const value = trimTrailingSlashes(raw.trim());
  if (/\/api\/service$/i.test(value)) return value;
  if (/\/api$/i.test(value)) return `${value}/Service`;
  return `${value}/api/Service`;
}

function appendSearchParams(target: URL, requestUrl: string) {
  const incoming = new URL(requestUrl);
  incoming.searchParams.forEach((value, key) => {
    target.searchParams.append(key, value);
  });
}

function buildTargetUrl(pathSegments: string[] | undefined, requestUrl: string): string {
  const base = getBackendServiceBaseUrl();
  const safePath = (pathSegments ?? []).map(encodeURIComponent).join('/');
  const target = new URL(safePath ? `${base}/${safePath}` : base);
  appendSearchParams(target, requestUrl);
  return normalizeLoopbackHost(target.toString());
}

function buildProxyHeaders(request: NextRequest, targetUrl: string): Headers {
  const headers = new Headers();

  request.headers.forEach((value, key) => {
    const normalizedKey = key.toLowerCase();
    if (!HOP_BY_HOP_HEADERS.has(normalizedKey)) {
      headers.set(key, value);
    }
  });

  // Keep-alive for local dev avoids connection storms when the dashboard loads many APIs at once.
  if (!(process.env.NODE_ENV === 'development' && isLocalBackendUrl(targetUrl))) {
    headers.set('connection', 'close');
  }

  headers.set('x-forwarded-host', request.headers.get('host') ?? '');
  headers.set('x-forwarded-proto', request.nextUrl.protocol.replace(':', ''));

  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) headers.set('x-forwarded-for', forwardedFor);

  return headers;
}

function buildResponseHeaders(upstreamHeaders: Headers): Headers {
  const headers = new Headers();

  upstreamHeaders.forEach((value, key) => {
    if (!STRIP_FROM_PROXY_RESPONSE.has(key.toLowerCase())) {
      headers.append(key, value);
    }
  });

  // Long-polling through IIS/HTTP2 proxies is more stable when connections are not reused.
  headers.set('connection', 'close');

  const getSetCookie = (upstreamHeaders as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  const setCookies = typeof getSetCookie === 'function' ? getSetCookie.call(upstreamHeaders) : [];
  for (const cookie of setCookies) {
    headers.append('set-cookie', cookie);
  }

  return headers;
}

function isMultipartUpload(request: NextRequest): boolean {
  const contentType = request.headers.get('content-type') ?? '';
  return contentType.toLowerCase().includes('multipart/form-data');
}

async function fetchUpstream(
  targetUrl: string,
  method: string,
  headers: Headers,
  request: NextRequest
): Promise<Response> {
  const hasBody = method !== 'GET' && method !== 'HEAD';

  if (hasBody && isMultipartUpload(request) && request.body) {
    const init: RequestInit & { duplex?: 'half' } = {
      method,
      headers,
      body: request.body,
      duplex: 'half',
      cache: 'no-store',
      redirect: 'manual',
    };
    return fetch(targetUrl, init);
  }

  return fetch(targetUrl, {
    method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    cache: 'no-store',
    redirect: 'manual',
  });
}

function buildMeetingHubTargetUrl(pathSegments: string[] | undefined, requestUrl: string): string {
  const base = `${getBackendApiOrigin()}/meetingHub`;
  const safePath = (pathSegments ?? []).map(encodeURIComponent).join('/');
  const target = new URL(safePath ? `${base}/${safePath}` : base);
  appendSearchParams(target, requestUrl);
  return normalizeLoopbackHost(target.toString());
}

function buildProjectQaHubTargetUrl(pathSegments: string[] | undefined, requestUrl: string): string {
  const base = `${getBackendApiOrigin()}/hubs/project-qa`;
  const safePath = (pathSegments ?? []).map(encodeURIComponent).join('/');
  const target = new URL(safePath ? `${base}/${safePath}` : base);
  appendSearchParams(target, requestUrl);
  return normalizeLoopbackHost(target.toString());
}

function buildHubTargetUrl(
  hubPath: string,
  pathSegments: string[] | undefined,
  requestUrl: string,
): string {
  const base = `${getBackendApiOrigin()}${hubPath}`;
  const safePath = (pathSegments ?? []).map(encodeURIComponent).join('/');
  const target = new URL(safePath ? `${base}/${safePath}` : base);
  appendSearchParams(target, requestUrl);
  return normalizeLoopbackHost(target.toString());
}

function buildPlatformSupportTicketHubTargetUrl(pathSegments: string[] | undefined, requestUrl: string): string {
  return buildHubTargetUrl('/hubs/platform-support-ticket', pathSegments, requestUrl);
}

function buildSupportChatHubTargetUrl(pathSegments: string[] | undefined, requestUrl: string): string {
  return buildHubTargetUrl('/hubs/support-chat', pathSegments, requestUrl);
}

function buildRemoteAssistHubTargetUrl(pathSegments: string[] | undefined, requestUrl: string): string {
  return buildHubTargetUrl('/hubs/remote-assist', pathSegments, requestUrl);
}

async function proxyUpstreamRequest(
  request: NextRequest,
  targetUrl: string,
  errorLabel: string
): Promise<Response> {
  const method = request.method.toUpperCase();

  const isUpgrade = request.headers.get('upgrade') === 'websocket';
  if (isUpgrade) {
    // Next.js route handlers cannot proxy WebSockets.
    // The browser must fall back to LongPolling or ServerSentEvents.
    return new Response('WebSocket proxying not supported in Next.js route handlers', { status: 400 });
  }

  const proxyHeaders = buildProxyHeaders(request, targetUrl);
  const maxAttempts =
    process.env.NODE_ENV === 'development' && isLocalBackendUrl(targetUrl) ? 3 : 1;

  let upstreamResponse: Response | undefined;
  try {
    ensureLocalTlsRelaxed();
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        upstreamResponse = await fetchUpstream(targetUrl, method, proxyHeaders, request);
        break;
      } catch (error) {
        if (attempt < maxAttempts && isConnectFailure(error)) {
          await sleep(400 * attempt);
          continue;
        }
        throw error;
      }
    }
    if (!upstreamResponse) {
      throw new Error('Upstream request did not return a response.');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${errorLabel} failed`, { targetUrl, error });
    return Response.json(
      {
        message: `${errorLabel} could not reach the API.`,
        detail: message,
        targetUrl,
        hint:
          process.env.NODE_ENV === 'development'
            ? 'Ensure the API is running (e.g. https profile on port 5001) and API_URL matches launchSettings.'
            : undefined,
      },
      { status: 502 }
    );
  }

  const responseHeaders = buildResponseHeaders(upstreamResponse.headers);
  const noBody =
    method === 'HEAD' || upstreamResponse.status === 204 || upstreamResponse.status === 304;

  if (noBody) {
    return new Response(null, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  }

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
}

export async function proxyMeetingHubRequest(
  request: NextRequest,
  context: ProxyRouteContext
): Promise<Response> {
  const { path } = await context.params;
  const targetUrl = buildMeetingHubTargetUrl(path, request.url);
  return proxyUpstreamRequest(request, targetUrl, 'MeetingHub proxy');
}

export async function proxyProjectQaHubRequest(
  request: NextRequest,
  context: ProxyRouteContext
): Promise<Response> {
  try {
    const { path } = await context.params;
    const targetUrl = buildProjectQaHubTargetUrl(path, request.url);
    return proxyUpstreamRequest(request, targetUrl, 'ProjectQaHub proxy');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('ProjectQaHub proxy route failed', message);
    return Response.json({ message: 'ProjectQaHub proxy failed.', detail: message }, { status: 500 });
  }
}

export async function proxyPlatformSupportTicketHubRequest(
  request: NextRequest,
  context: ProxyRouteContext,
): Promise<Response> {
  try {
    const { path } = await context.params;
    const targetUrl = buildPlatformSupportTicketHubTargetUrl(path, request.url);
    return proxyUpstreamRequest(request, targetUrl, 'PlatformSupportTicketHub proxy');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('PlatformSupportTicketHub proxy route failed', message);
    return Response.json({ message: 'PlatformSupportTicketHub proxy failed.', detail: message }, { status: 500 });
  }
}

export async function proxySupportChatHubRequest(
  request: NextRequest,
  context: ProxyRouteContext,
): Promise<Response> {
  try {
    const { path } = await context.params;
    const targetUrl = buildSupportChatHubTargetUrl(path, request.url);
    return proxyUpstreamRequest(request, targetUrl, 'SupportChatHub proxy');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('SupportChatHub proxy route failed', message);
    return Response.json({ message: 'SupportChatHub proxy failed.', detail: message }, { status: 500 });
  }
}

export async function proxyRemoteAssistHubRequest(
  request: NextRequest,
  context: ProxyRouteContext,
): Promise<Response> {
  try {
    const { path } = await context.params;
    const targetUrl = buildRemoteAssistHubTargetUrl(path, request.url);
    return proxyUpstreamRequest(request, targetUrl, 'RemoteAssistHub proxy');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('RemoteAssistHub proxy route failed', message);
    return Response.json({ message: 'RemoteAssistHub proxy failed.', detail: message }, { status: 500 });
  }
}

export async function proxyBackendRequest(
  request: NextRequest,
  context: ProxyRouteContext
): Promise<Response> {
  const { path } = await context.params;
  const targetUrl = buildTargetUrl(path, request.url);
  return proxyUpstreamRequest(request, targetUrl, 'Backend API proxy');
}

function buildStaticAssetTargetUrl(
  rootFolder: string,
  pathSegments: string[] | undefined,
  requestUrl: string
): string {
  const base = `${getBackendApiOrigin()}/${rootFolder.replace(/^\/+|\/+$/g, '')}`;
  const safePath = (pathSegments ?? [])
    .map((segment) => encodeURIComponent(decodeURIComponent(segment)))
    .join('/');
  const target = new URL(safePath ? `${base}/${safePath}` : base);
  appendSearchParams(target, requestUrl);
  return normalizeLoopbackHost(target.toString());
}

export async function proxyStaticAssetRequest(
  request: NextRequest,
  context: ProxyRouteContext,
  rootFolder: string
): Promise<Response> {
  const { path } = await context.params;
  const targetUrl = buildStaticAssetTargetUrl(rootFolder, path, request.url);
  return proxyUpstreamRequest(request, targetUrl, `${rootFolder} static proxy`);
}
