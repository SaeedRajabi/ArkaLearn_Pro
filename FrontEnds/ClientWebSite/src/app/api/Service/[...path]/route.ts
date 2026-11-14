import { NextRequest } from 'next/server';
import { getBackendServiceBaseUrl } from '@/lib/api/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 3600;

if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = process.env.NODE_TLS_REJECT_UNAUTHORIZED || '0';
}

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
]);

type RouteContext = {
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

function buildTargetUrl(pathSegments: string[] | undefined, requestUrl: string): string {
  const base = getBackendServiceBaseUrl().replace(/\/$/, '');
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
  headers.set('x-forwarded-for', request.headers.get('x-forwarded-for') ?? '');

  return headers;
}

function buildResponseHeaders(upstreamHeaders: Headers): Headers {
  const headers = new Headers();

  upstreamHeaders.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers.append(key, value);
    }
  });

  const getSetCookie = (upstreamHeaders as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  const setCookies = typeof getSetCookie === 'function' ? getSetCookie.call(upstreamHeaders) : [];
  for (const cookie of setCookies) {
    headers.append('set-cookie', cookie);
  }

  return headers;
}

async function proxyRequest(request: NextRequest, context: RouteContext): Promise<Response> {
  const { path } = await context.params;
  const targetUrl = buildTargetUrl(path, request.url);
  const method = request.method.toUpperCase();
  const hasBody = method !== 'GET' && method !== 'HEAD';
  const isUploadCompletion = method === 'POST' && path?.length === 2 &&
    ['userfile', 'room'].includes(path[0].toLowerCase()) && path[1].toLowerCase() === 'uploadfilecomplete';

  try {
    const upstreamResponse = await fetch(targetUrl, {
      method,
      headers: buildProxyHeaders(request),
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: 'no-store',
      redirect: 'manual',
      signal: AbortSignal.timeout(isUploadCompletion ? 3_600_000 : 120_000),
    });

    const responseHeaders = buildResponseHeaders(upstreamResponse.headers);
    const body = method === 'HEAD' || upstreamResponse.status === 204 || upstreamResponse.status === 304
      ? null
      : upstreamResponse.body;

    return new Response(body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upstream request failed';
    return Response.json(
      {
        message: 'Backend API is unavailable. Ensure the API is running and NEXT_PUBLIC_API_URL is correct.',
        detail: message,
        targetUrl,
      },
      { status: 502 },
    );
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function HEAD(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}
