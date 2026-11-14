import { NextRequest } from 'next/server';
import { getBackendServiceBaseUrl } from '@/lib/api/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
/** Large video downloads may take a long time — avoid short proxy timeouts. */
export const maxDuration = 3600;

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

function buildProxyHeaders(request: NextRequest): Headers {
  const headers = new Headers();

  request.headers.forEach((value, key) => {
    const normalizedKey = key.toLowerCase();
    if (!HOP_BY_HOP_HEADERS.has(normalizedKey)) {
      headers.set(key, value);
    }
  });

  const range = request.headers.get('range');
  if (range) {
    headers.set('range', range);
  }

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

/**
 * Proxy student/professor file download same-origin.
 * Follow redirects server-side so the browser never hits cross-origin SignedRead (CORS / Failed to fetch).
 */
async function proxyUserFileDownload(request: NextRequest, method: 'GET' | 'HEAD'): Promise<Response> {
  const fileId = request.nextUrl.searchParams.get('fileId')?.trim();
  if (!fileId) {
    return method === 'HEAD'
      ? new Response(null, { status: 400 })
      : Response.json({ message: 'fileId is required.' }, { status: 400 });
  }

  const targetUrl = `${getBackendServiceBaseUrl().replace(/\/$/, '')}/UserFile/Download?fileId=${encodeURIComponent(fileId)}`;

  try {
    const upstreamResponse = await fetch(targetUrl, {
      method,
      headers: buildProxyHeaders(request),
      cache: 'no-store',
      // Follow SignedRead (or any) redirect on the server — keep body same-origin for the browser.
      redirect: 'follow',
    });

    const responseHeaders = buildResponseHeaders(upstreamResponse.headers);
    if (method === 'HEAD') {
      return new Response(null, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers: responseHeaders,
      });
    }

    const body =
      upstreamResponse.status === 204 || upstreamResponse.status === 304 ? null : upstreamResponse.body;

    return new Response(body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Download proxy failed';
    if (method === 'HEAD') {
      return new Response(null, { status: 502 });
    }
    return Response.json(
      {
        message: 'Could not reach the file download service.',
        detail: message,
      },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest) {
  return proxyUserFileDownload(request, 'GET');
}

export async function HEAD(request: NextRequest) {
  return proxyUserFileDownload(request, 'HEAD');
}
