/** Edge-safe OG image URL builder (no Node.js fs/path APIs). */

export function buildDynamicOgImageUrl(
  title: string,
  description?: string,
  locale: 'fa' | 'en' = 'fa',
): string {
  const params = new URLSearchParams({
    title: title.slice(0, 100),
    locale,
  });
  if (description?.trim()) {
    params.set('description', description.trim().slice(0, 160));
  }
  return `/og?${params.toString()}`;
}
