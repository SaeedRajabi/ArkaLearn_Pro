import { siteUrl, seoConfig } from '@/lib/seo';
import { BRAND_ALTERNATE_NAMES, BRAND_NAME_EN, BRAND_NAME_FA } from '@/lib/seo/brand';

/** WebSite schema with a working on-site search entry point for Google Sitelinks Search Box. */
export function JsonLdWebSite() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    name: BRAND_NAME_FA,
    alternateName: [...BRAND_ALTERNATE_NAMES, BRAND_NAME_EN],
    url: siteUrl,
    inLanguage: ['fa-IR', 'en-US'],
    publisher: { '@id': `${siteUrl}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/tags/{search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
