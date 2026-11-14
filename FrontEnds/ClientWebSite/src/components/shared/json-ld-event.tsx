import { siteUrl, seoConfig } from '@/lib/seo';
import { BRAND_ICON_PATH } from '@/lib/seo/brand';
import { toAbsoluteUrl } from '@/lib/seo/meta-helpers';
import { getTagUrl } from '@/lib/seo/tag-utils';

export function JsonLdEvent({
  title,
  description,
  path,
  image,
  startDate,
  endDate,
  isFree,
  price,
  performerName,
  tags,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  startDate?: string;
  endDate?: string;
  isFree?: boolean;
  price?: number;
  performerName?: string;
  tags?: string[];
}) {
  const url = toAbsoluteUrl(path, siteUrl);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: title,
    description,
    url,
    image: image ? toAbsoluteUrl(image, siteUrl) : `${siteUrl}${BRAND_ICON_PATH}`,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: {
      '@type': 'VirtualLocation',
      url,
    },
    organizer: {
      '@type': 'Organization',
      name: seoConfig.siteName,
      url: siteUrl,
    },
    ...(performerName
      ? {
          performer: {
            '@type': 'Person',
            name: performerName,
            url: `${siteUrl}/about`,
          },
        }
      : {}),
    offers: {
      '@type': 'Offer',
      price: isFree || !price ? 0 : price,
      priceCurrency: 'IRR',
      url,
      availability: 'https://schema.org/InStock',
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
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
