import { siteUrl, seoConfig } from '@/lib/seo';
import { BRAND_ICON_PATH } from '@/lib/seo/brand';
import { toAbsoluteUrl } from '@/lib/seo/meta-helpers';
import { getTagUrl } from '@/lib/seo/tag-utils';

export function JsonLdArticle({
  title,
  description,
  path,
  image,
  datePublished,
  dateModified,
  authorName,
  category,
  tags,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
  category?: string;
  tags?: string[];
}) {
  const url = toAbsoluteUrl(path, siteUrl);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    image: image ? [toAbsoluteUrl(image, siteUrl)] : [`${siteUrl}${BRAND_ICON_PATH}`],
    datePublished: datePublished || undefined,
    dateModified: dateModified || datePublished || undefined,
    author: {
      '@type': 'Person',
      name: authorName || 'Saeed Rajabi',
      url: `${siteUrl}/about`,
    },
    publisher: {
      '@type': 'Organization',
      name: seoConfig.siteName,
      url: siteUrl,
      logo: { '@type': 'ImageObject', url: `${siteUrl}${BRAND_ICON_PATH}` },
    },
    ...(category ? { articleSection: category } : {}),
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
