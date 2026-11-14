import { siteUrl } from '@/lib/seo/site-url';

export type SiteLocale = 'fa' | 'en';

export const SEO_SUPPORTED_LOCALES: SiteLocale[] = ['fa', 'en'];

/** BCP-47 hreflang values used in alternates.languages */
export const SEO_HREFLANG_MAP: Record<SiteLocale, string> = {
  fa: 'fa-IR',
  en: 'en-US',
};

function normalizePath(path: string): string {
  if (!path || path === '/') return '/';
  return path.startsWith('/') ? path : `/${path}`;
}

/** hreflang alternates for cookie/query-based bilingual URLs (same path, ?lang=). */
export function buildLanguageAlternates(path = '/'): Record<string, string> {
  const cleanPath = normalizePath(path);
  const suffix = cleanPath === '/' ? '' : cleanPath;

  return {
    [SEO_HREFLANG_MAP.fa]: `${siteUrl}${suffix}?lang=fa`,
    [SEO_HREFLANG_MAP.en]: `${siteUrl}${suffix}?lang=en`,
    'x-default': `${siteUrl}${suffix}?lang=fa`,
  };
}

export function isSiteLocale(value: string | null | undefined): value is SiteLocale {
  return value === 'fa' || value === 'en';
}

export function resolveSiteLocale(
  preferred?: string | null,
  fallback: SiteLocale = 'fa',
): SiteLocale {
  return isSiteLocale(preferred) ? preferred : fallback;
}

export const SITE_LOCALE_HEADER = 'x-site-locale';
