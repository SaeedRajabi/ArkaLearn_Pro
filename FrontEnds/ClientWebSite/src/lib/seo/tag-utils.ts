/** URL-safe tag slug (supports Persian and Latin tags). */
export function tagToSlug(tag: string): string {
  const trimmed = tag.trim();
  if (!trimmed) return '';
  return encodeURIComponent(trimmed.toLowerCase().replace(/\s+/g, '-'));
}

export function slugToTag(slug: string): string {
  try {
    return decodeURIComponent(slug).replace(/-/g, ' ').trim();
  } catch {
    return slug.replace(/-/g, ' ').trim();
  }
}

export function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase();
}

export function tagsMatch(a: string, b: string): boolean {
  return normalizeTag(a) === normalizeTag(b);
}

export function itemHasTag(tags: string[] | undefined | null, tag: string): boolean {
  const norm = normalizeTag(tag);
  return (tags ?? []).some((t) => normalizeTag(t) === norm);
}

export function getTagUrl(tag: string): string {
  const slug = tagToSlug(tag);
  return slug ? `/tags/${slug}` : '/tags';
}

export function mergeUniqueTags(...groups: (string[] | undefined | null)[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const group of groups) {
    for (const raw of group ?? []) {
      const tag = String(raw ?? '').trim();
      if (!tag) continue;
      const key = normalizeTag(tag);
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(tag);
    }
  }
  return result.sort((a, b) => a.localeCompare(b, 'fa'));
}
