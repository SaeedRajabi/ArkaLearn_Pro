import { siteUrl, seoConfig } from '@/lib/seo';
import { BRAND_ICON_PATH } from '@/lib/seo/brand';
import { toAbsoluteUrl } from '@/lib/seo/meta-helpers';
import { getTagUrl } from '@/lib/seo/tag-utils';

export function JsonLdCourse({
  title,
  description,
  path,
  image,
  providerName,
  category,
  tags,
  price,
  currency = 'USD',
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  providerName?: string;
  category?: string;
  tags?: string[];
  price?: number;
  currency?: string;
}) {
  const url = toAbsoluteUrl(path, siteUrl);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: title,
    description,
    url,
    image: image ? toAbsoluteUrl(image, siteUrl) : `${siteUrl}${BRAND_ICON_PATH}`,
    provider: {
      '@type': 'Organization',
      name: providerName || seoConfig.siteName,
      url: siteUrl,
      sameAs: siteUrl,
    },
    ...(category ? { courseCategory: category } : {}),
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
    ...(price != null && price > 0
      ? {
          offers: {
            '@type': 'Offer',
            price,
            priceCurrency: currency,
            url,
            availability: 'https://schema.org/InStock',
          },
        }
      : {
          offers: {
            '@type': 'Offer',
            price: 0,
            priceCurrency: currency,
            url,
            availability: 'https://schema.org/InStock',
          },
        }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
