import { NextRequest } from 'next/server';
import { getBackendServiceBaseUrl } from '@/lib/api/config';
import { getSoftwareFileUrl } from '@/lib/utils/image-url';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
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

  return headers;
}

function unwrapSoftwareRow(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const candidates = [obj.data, obj.Data, obj.queryResult, obj.QueryResult, obj];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) continue;
    const row = candidate as Record<string, unknown>;
    if (row.installerFileUrl ?? row.InstallerFileUrl ?? row.slug ?? row.Slug) return row;
  }
  return null;
}

async function resolveInstallerUrl(
  slug?: string,
  softwareId?: number
): Promise<{ fileUrl: string; fileName: string } | null> {
  const slugCandidates = [
    slug?.trim(),
    softwareId && softwareId > 0 ? `item-${softwareId}` : undefined,
  ].filter((value): value is string => Boolean(value));

  for (const candidate of slugCandidates) {
    const resolved = await fetchInstallerBySlug(candidate);
    if (resolved) return resolved;
  }

  return null;
}

async function fetchInstallerBySlug(slug: string): Promise<{ fileUrl: string; fileName: string } | null> {
  const base = getBackendServiceBaseUrl().replace(/\/$/, '');
  const targetUrl = `${base}/Software/GetBySlug?slug=${encodeURIComponent(slug)}`;

  const response = await fetch(targetUrl, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) return null;

  const raw = await response.json();
  const row = unwrapSoftwareRow(raw);
  if (!row) return null;

  const installerPath = String(row.installerFileUrl ?? row.InstallerFileUrl ?? '').trim();
  if (!installerPath) return null;

  const fileName = String(row.installerFileName ?? row.InstallerFileName ?? '').trim() || 'software-installer';
  return {
    fileUrl: getSoftwareFileUrl(installerPath),
    fileName,
  };
}

async function proxyInstaller(
  request: NextRequest,
  slug?: string,
  softwareId?: number
): Promise<Response> {
  const resolved = await resolveInstallerUrl(slug, softwareId);
  if (!resolved?.fileUrl) {
    return Response.json({ message: 'Installer file not found.' }, { status: 404 });
  }

  try {
    const upstreamResponse = await fetch(resolved.fileUrl, {
      method: request.method,
      headers: buildProxyHeaders(request),
      cache: 'no-store',
      redirect: 'follow',
    });

    const responseHeaders = buildResponseHeaders(upstreamResponse.headers);
    if (!responseHeaders.get('content-disposition')) {
      responseHeaders.set(
        'content-disposition',
        `attachment; filename="${encodeURIComponent(resolved.fileName)}"`
      );
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
    return Response.json(
      {
        message: 'Could not reach the software installer.',
        detail: message,
      },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')?.trim();
  const softwareId = Number(request.nextUrl.searchParams.get('softwareId') ?? 0) || undefined;

  if (!slug && !softwareId) {
    return Response.json({ message: 'slug or softwareId is required.' }, { status: 400 });
  }

  return proxyInstaller(request, slug, softwareId);
}

export async function HEAD(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')?.trim();
  const softwareId = Number(request.nextUrl.searchParams.get('softwareId') ?? 0) || undefined;

  if (!slug && !softwareId) {
    return new Response(null, { status: 400 });
  }

  return proxyInstaller(request, slug, softwareId);
}
