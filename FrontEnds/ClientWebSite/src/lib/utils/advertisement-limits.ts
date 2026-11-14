export function parseAdvertisementTags(raw: string): string[] {
  return raw
    .split(/[,،]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export function dedupeAdvertisementTags(tags: string[]): string[] {
  const seen = new Set<string>();
  return tags.filter((tag) => {
    const key = tag.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export function getPlainTextLengthFromHtml(html: string): number {
  if (!html) return 0;
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim().length;
}

export function tagsInputFromList(tags: string[]): string {
  return tags.join(', ');
}
