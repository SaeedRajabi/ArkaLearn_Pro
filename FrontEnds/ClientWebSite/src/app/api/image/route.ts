import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import {
  clampImageDimension,
  clampQuality,
  getBackendAssetOrigin,
  isDirectAssetHost,
  resolveImageSource,
} from '@/lib/image-proxy/security';

export const runtime = 'nodejs';

const ONE_YEAR = 60 * 60 * 24 * 365;

async function fetchImageBuffer(sourceUrl: URL, requestOrigin: string): Promise<Buffer> {
  const pathname = sourceUrl.pathname;
  const isStaticPublicAsset =
    sourceUrl.origin === requestOrigin &&
    (/^\/(?:icons|placeholder-images|fonts|favicon\.ico)\//i.test(pathname) ||
      /^\/placeholder-[^/]+\.(?:png|jpe?g|webp|gif|svg|avif)$/i.test(pathname));

  if (isStaticPublicAsset) {
    const { readFile } = await import('node:fs/promises');
    const { join } = await import('node:path');
    return readFile(join(process.cwd(), 'public', pathname.replace(/^\//, '')));
  }

  // Absolute URLs on msg/api (or STATIC_ASSET_BASE) must be fetched as-is — do not rewrite to the wrong host.
  let fetchUrl = sourceUrl.toString();
  if (sourceUrl.origin === requestOrigin && !isDirectAssetHost(sourceUrl.hostname)) {
    fetchUrl = new URL(`${pathname}${sourceUrl.search}`, getBackendAssetOrigin(requestOrigin)).toString();
  } else if (
    sourceUrl.origin !== requestOrigin &&
    !isDirectAssetHost(sourceUrl.hostname) &&
    pathname.startsWith('/')
  ) {
    fetchUrl = new URL(`${pathname}${sourceUrl.search}`, getBackendAssetOrigin(requestOrigin)).toString();
  }

  const response = await fetch(fetchUrl, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`Image fetch failed (${response.status})`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url');
  if (!rawUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  const requestOrigin = request.nextUrl.origin;
  const sourceUrl = resolveImageSource(rawUrl, requestOrigin);
  if (!sourceUrl) {
    return NextResponse.json({ error: 'Invalid or disallowed image url' }, { status: 400 });
  }

  const width = clampImageDimension(
    Number(request.nextUrl.searchParams.get('w')),
    828,
    1920,
  );
  const quality = clampQuality(Number(request.nextUrl.searchParams.get('q')), 75);

  try {
    const input = await fetchImageBuffer(sourceUrl, requestOrigin);
    const optimized = await sharp(input)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();

    return new NextResponse(new Uint8Array(optimized), {
      status: 200,
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': `public, max-age=${ONE_YEAR}, immutable`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Image optimization failed' }, { status: 502 });
  }
}
