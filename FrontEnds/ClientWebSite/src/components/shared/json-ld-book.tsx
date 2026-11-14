import { siteUrl, seoConfig } from '@/lib/seo';
import { BRAND_ICON_PATH } from '@/lib/seo/brand';
import { toAbsoluteUrl } from '@/lib/seo/meta-helpers';
import { getTagUrl } from '@/lib/seo/tag-utils';

export function JsonLdBook({
  title,
  description,
  path,
  image,
  isbn,
  publisher,
  publicationYear,
  authorName,
  authorUrl,
  tags,
  downloadUrl,
  encodingFormat,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  isbn?: string;
  publisher?: string;
  publicationYear?: number;
  authorName?: string;
  authorUrl?: string;
  tags?: string[];
  downloadUrl?: string;
  encodingFormat?: string;
}) {
  const url = toAbsoluteUrl(path, siteUrl);
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: title,
    description,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    image: image ? [toAbsoluteUrl(image, siteUrl)] : [`${siteUrl}${BRAND_ICON_PATH}`],
    inLanguage: 'fa-IR',
    ...(isbn?.trim() ? { isbn: isbn.trim() } : {}),
    ...(publisher?.trim()
      ? { publisher: { '@type': 'Organization', name: publisher.trim() } }
      : {}),
    ...(publicationYear
      ? { datePublished: `${publicationYear}-01-01` }
      : {}),
    author: {
      '@type': 'Person',
      name: authorName || 'ArkaSoftware Teacher',
      ...(authorUrl ? { url: toAbsoluteUrl(authorUrl, siteUrl) } : {}),
    },
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
    ...(downloadUrl?.trim()
      ? {
          encoding: {
            '@type': 'MediaObject',
            contentUrl: toAbsoluteUrl(downloadUrl, siteUrl),
            ...(encodingFormat?.trim() ? { encodingFormat: encodingFormat.trim() } : {}),
          },
        }
      : {}),
    provider: {
      '@type': 'Organization',
      name: seoConfig.siteName,
      url: siteUrl,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
