/** Strip HTML tags and collapse whitespace for meta descriptions. */
export function stripHtmlForMeta(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncateMeta(text: string, max = 160): string {
  const clean = text.trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 3).trimEnd()}...`;
}

export function buildMetaDescription(
  primary?: string | null,
  fallback?: string | null,
  max = 160
): string {
  const raw = (primary || fallback || '').trim();
  if (!raw) return '';
  const plain = stripHtmlForMeta(raw);
  return truncateMeta(plain, max);
}

export function toAbsoluteUrl(pathOrUrl: string, siteUrl: string): string {
  if (!pathOrUrl) return siteUrl;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${siteUrl.replace(/\/+$/, '')}${path}`;
}
