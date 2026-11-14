import { getBackendApiOrigin, resolveStaticAssetUrl } from '@/lib/api-config';

/** Turn stored media paths into absolute URLs the browser can load. */
export function resolveMediaUrl(url?: string | null): string {
  if (!url) return '';

  const raw = String(url).trim();
  if (!raw) return '';
  if (/^(data:|blob:)/i.test(raw)) return raw;

  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      if (/^\/(?:images|audio|videos)\//i.test(parsed.pathname)) {
        return `${getBackendApiOrigin()}${parsed.pathname}`;
      }
    } catch {
      return raw;
    }
    return raw;
  }

  const path = raw.startsWith('/') ? raw : `/${raw}`;
  const resolved = resolveStaticAssetUrl(path);
  if (resolved) return resolved;

  return `${getBackendApiOrigin()}${path}`;
}

/** Rewrite relative src attributes in rich HTML (questions, answers). */
export function resolveRichTextHtml(html: string): string {
  if (!html) return '';

  const toAbsolute = (path: string) => resolveMediaUrl(path);

  return html
    .replace(/src="(\/[^"]+)"/gi, (_, path) => `src="${toAbsolute(path)}"`)
    .replace(/src='(\/[^']+)'/gi, (_, path) => `src='${toAbsolute(path)}'`);
}
