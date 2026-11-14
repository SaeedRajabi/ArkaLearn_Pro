import type { ImageLoaderProps } from 'next/image';

const IMAGE_PROXY_ENABLED = process.env.NEXT_PUBLIC_IMAGE_PROXY !== 'false';

function isMsgAssetUrl(src: string): boolean {
  try {
    if (!/^https?:\/\//i.test(src)) return false;
    const host = new URL(src).hostname.toLowerCase();
    return host === 'msg.arkasoftware.ir' || host.startsWith('msg.');
  } catch {
    return false;
  }
}

function shouldBypassProxy(src: string): boolean {
  if (!IMAGE_PROXY_ENABLED) return true;
  if (src.startsWith('data:') || src.startsWith('blob:')) return true;
  if (src.endsWith('.svg')) return true;
  // Download host is plain static files — no need to optimize through Next proxy.
  if (isMsgAssetUrl(src)) return true;
  return false;
}

/**
 * Custom next/image loader.
 * For msg static hosting: put width in a URL hash (#w=) so Next.js is satisfied,
 * but the browser request to IIS does NOT include ?w= (hashes are not sent to the server).
 */
export default function arkaImageLoader({ src, width, quality }: ImageLoaderProps): string {
  if (shouldBypassProxy(src)) {
    const clean = src.split('#')[0] ?? src;
    return `${clean}#w=${width}`;
  }

  const params = new URLSearchParams({
    url: src,
    w: String(width),
    q: String(quality ?? 75),
  });

  return `/api/image?${params.toString()}`;
}
