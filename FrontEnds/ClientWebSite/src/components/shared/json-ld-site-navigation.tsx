import { siteUrl } from '@/lib/seo';

/** Highlights primary site sections — helps Google understand important internal pages (sitelinks). */
export function JsonLdSiteNavigation() {
  const items = [
    { name: 'دوره‌های آموزشی', url: `${siteUrl}/courses` },
    { name: 'اساتید', url: `${siteUrl}/teachers` },
    { name: 'سمینارها', url: `${siteUrl}/seminars` },
    { name: 'مقالات', url: `${siteUrl}/articles` },
    { name: 'پروژه‌ها', url: `${siteUrl}/projects` },
    { name: 'درباره ما', url: `${siteUrl}/about` },
    { name: 'تماس با ما', url: `${siteUrl}/contact` },
    { name: 'ثبت‌نام', url: `${siteUrl}/register` },
    { name: 'ورود', url: `${siteUrl}/login` },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': items.map((item, index) => ({
      '@type': 'SiteNavigationElement',
      '@id': `${siteUrl}/#nav-${index + 1}`,
      name: item.name,
      url: item.url,
      isPartOf: { '@id': `${siteUrl}/#website` },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
