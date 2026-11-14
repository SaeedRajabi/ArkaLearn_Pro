import { siteUrl, seoConfig } from '@/lib/seo';
import { BRAND_ICON_PATH } from '@/lib/seo/brand';
import { toAbsoluteUrl } from '@/lib/seo/meta-helpers';
import { getTagUrl } from '@/lib/seo/tag-utils';

export function JsonLdProject({
  title,
  description,
  path,
  image,
  authorName,
  technologies,
  tags,
  codeRepository,
  liveUrl,
  datePublished,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  authorName?: string;
  technologies?: string[];
  tags?: string[];
  codeRepository?: string;
  liveUrl?: string;
  datePublished?: string;
}) {
  const url = toAbsoluteUrl(path, siteUrl);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: title,
    description,
    url,
    image: image ? toAbsoluteUrl(image, siteUrl) : `${siteUrl}${BRAND_ICON_PATH}`,
    datePublished: datePublished || undefined,
    programmingLanguage: technologies?.length ? technologies : undefined,
    author: {
      '@type': 'Person',
      name: authorName || 'Saeed Rajabi',
      url: `${siteUrl}/about`,
    },
    publisher: {
      '@type': 'Organization',
      name: seoConfig.siteName,
      url: siteUrl,
    },
    ...(codeRepository ? { codeRepository } : {}),
    ...(liveUrl ? { targetProduct: { '@type': 'SoftwareApplication', url: liveUrl } } : {}),
    ...(tags?.length
      ? {
          keywords: tags.join(', '),
          about: tags.map((tag) => ({
            '@type': 'Thing',
            name: tag,
            url: `${siteUrl}${getTagUrl(tag)}`,
          })),
        }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
