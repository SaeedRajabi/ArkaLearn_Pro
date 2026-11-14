import { NextRequest } from 'next/server';
import { getBackendApiOrigin } from '@/lib/api/config';

function ensureLocalTlsRelaxed(): void {
  if (process.env.ARKA_RELAX_LOCAL_TLS === '0') return;
  if (/localhost|127\.0\.0\.1/i.test(getBackendApiOrigin())) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
}

/** Allow ASP.NET dev certificate when proxying to https://localhost in development. */
if (process.env.NODE_ENV === 'development') {
  ensureLocalTlsRelaxed();
}

export const proxyRuntime = 'nodejs';
export const proxyDynamic = 'force-dynamic';

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

/** Node fetch decompresses gzip/br; forwarding content-encoding breaks clients. */
const STRIP_FROM_PROXY_RESPONSE = new Set([...HOP_BY_HOP_HEADERS, 'content-encoding']);

export type HubProxyRouteContext = {
  params: Promise<{
    path?: string[];
  }>;
};

function appendSearchParams(target: URL, requestUrl: string) {
  const incoming = new URL(requestUrl);
  incoming.searchParams.forEach((value, key) => {
    target.searchParams.append(key, value);
  });
}

function buildHubTargetUrl(hubPath: string, pathSegments: string[] | undefined, requestUrl: string): string {
  const base = `${getBackendApiOrigin()}${hubPath}`;
  const safePath = (pathSegments ?? []).map(encodeURIComponent).join('/');
  const target = new URL(safePath ? `${base}/${safePath}` : base);
  appendSearchParams(target, requestUrl);
  return target.toString();
}

function buildProxyHeaders(request: NextRequest): Headers {
  const headers = new Headers();

  request.headers.forEach((value, key) => {
    const normalizedKey = key.toLowerCase();
    if (!HOP_BY_HOP_HEADERS.has(normalizedKey)) {
      headers.set(key, value);
    }
  });

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

  return headers;
}

async function proxyUpstreamRequest(
  request: NextRequest,
  targetUrl: string,
  errorLabel: string
): Promise<Response> {
  const method = request.method.toUpperCase();

  if (request.headers.get('upgrade') === 'websocket') {
    return new Response('WebSocket proxying not supported in Next.js route handlers', { status: 400 });
  }

  const hasBody = method !== 'GET' && method !== 'HEAD';

  let upstreamResponse: Response;
  try {
    ensureLocalTlsRelaxed();
    upstreamResponse = await fetch(targetUrl, {
      method,
      headers: buildProxyHeaders(request),
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: 'no-store',
      redirect: 'manual',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${errorLabel} failed`, { targetUrl, error: message });
    return Response.json(
      {
        message: `${errorLabel} could not reach the API.`,
        detail: message,
        targetUrl,
        hint:
          process.env.NODE_ENV === 'development'
            ? 'Ensure the API is running (e.g. https://localhost:5001) and NEXT_PUBLIC_API_URL matches.'
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

export async function proxyProjectQaHubRequest(
  request: NextRequest,
  context: HubProxyRouteContext
): Promise<Response> {
  try {
    const { path } = await context.params;
    const targetUrl = buildHubTargetUrl('/hubs/project-qa', path, request.url);
    return proxyUpstreamRequest(request, targetUrl, 'ProjectQaHub proxy');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('ProjectQaHub proxy route failed', message);
    return Response.json({ message: 'ProjectQaHub proxy failed.', detail: message }, { status: 500 });
  }
}

export async function proxyCommunityQaHubRequest(
  request: NextRequest,
  context: HubProxyRouteContext
): Promise<Response> {
  try {
    const { path } = await context.params;
    const targetUrl = buildHubTargetUrl('/hubs/community-qa', path, request.url);
    return proxyUpstreamRequest(request, targetUrl, 'CommunityQaHub proxy');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('CommunityQaHub proxy route failed', message);
    return Response.json({ message: 'CommunityQaHub proxy failed.', detail: message }, { status: 500 });
  }
}

export async function proxyEngagementHubRequest(
  request: NextRequest,
  context: HubProxyRouteContext
): Promise<Response> {
  try {
    const { path } = await context.params;
    const targetUrl = buildHubTargetUrl('/hubs/engagement', path, request.url);
    return proxyUpstreamRequest(request, targetUrl, 'EngagementHub proxy');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('EngagementHub proxy route failed', message);
    return Response.json({ message: 'EngagementHub proxy failed.', detail: message }, { status: 500 });
  }
}

export async function proxySupportChatHubRequest(
  request: NextRequest,
  context: HubProxyRouteContext
): Promise<Response> {
  try {
    const { path } = await context.params;
    const targetUrl = buildHubTargetUrl('/hubs/support-chat', path, request.url);
    return proxyUpstreamRequest(request, targetUrl, 'SupportChatHub proxy');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('SupportChatHub proxy route failed', message);
    return Response.json({ message: 'SupportChatHub proxy failed.', detail: message }, { status: 500 });
  }
}

export async function proxyPlatformSupportTicketHubRequest(
  request: NextRequest,
  context: HubProxyRouteContext
): Promise<Response> {
  try {
    const { path } = await context.params;
    const targetUrl = buildHubTargetUrl('/hubs/platform-support-ticket', path, request.url);
    return proxyUpstreamRequest(request, targetUrl, 'PlatformSupportTicketHub proxy');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('PlatformSupportTicketHub proxy route failed', message);
    return Response.json({ message: 'PlatformSupportTicketHub proxy failed.', detail: message }, { status: 500 });
  }
}

export async function proxyRemoteAssistHubRequest(
  request: NextRequest,
  context: HubProxyRouteContext
): Promise<Response> {
  try {
    const { path } = await context.params;
    const targetUrl = buildHubTargetUrl('/hubs/remote-assist', path, request.url);
    return proxyUpstreamRequest(request, targetUrl, 'RemoteAssistHub proxy');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('RemoteAssistHub proxy route failed', message);
    return Response.json({ message: 'RemoteAssistHub proxy failed.', detail: message }, { status: 500 });
  }
}
