import { siteUrl, seoConfig } from '@/lib/seo';
import { BRAND_ALTERNATE_NAMES, BRAND_ICON_PATH, BRAND_NAME_EN, BRAND_NAME_FA, BRAND_OG_IMAGE_PATH } from '@/lib/seo/brand';
import type { ContactUsQri } from '@/lib/api/types';
import {
  CONTACT_EMAIL,
  CONTACT_PHONE,
  CONTACT_ADDRESS_FA,
} from '@/lib/constants/contact';

function buildSameAs(contactContent?: ContactUsQri | null): string[] {
  const social = [
    contactContent?.linkedInUrl?.trim(),
    contactContent?.instagramUrl?.trim(),
    contactContent?.facebookUrl?.trim(),
    contactContent?.twitterUrl?.trim(),
  ].filter((url): url is string => Boolean(url));

  if (social.length > 0) return social;
  return [siteUrl, `${siteUrl}/about`, `${siteUrl}/contact`];
}

/** JSON-LD structured data for brand, contact, and local business signals. */
export function JsonLdOrganization({ contactContent }: { contactContent?: ContactUsQri | null }) {
  const telephone =
    contactContent?.contactInfoPhone?.trim() ||
    contactContent?.headquartersPhone?.trim() ||
    CONTACT_PHONE;
  const email =
    contactContent?.contactInfoEmail?.trim() ||
    contactContent?.headquartersEmail?.trim() ||
    CONTACT_EMAIL;
  const streetAddress =
    contactContent?.headquartersAddress?.trim() || CONTACT_ADDRESS_FA;

  const organization = {
    '@type': ['Organization', 'EducationalOrganization'],
    '@id': `${siteUrl}/#organization`,
    name: BRAND_NAME_FA,
    alternateName: [...BRAND_ALTERNATE_NAMES, BRAND_NAME_EN],
    url: siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${siteUrl}${BRAND_ICON_PATH}`,
      width: 512,
      height: 512,
    },
    image: `${siteUrl}${BRAND_OG_IMAGE_PATH}`,
    description: seoConfig.defaultDescription,
    telephone,
    email,
    address: {
      '@type': 'PostalAddress',
      streetAddress,
      addressLocality: 'Tehran',
      addressRegion: 'Tehran Province',
      addressCountry: 'IR',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      telephone,
      email,
      availableLanguage: ['Persian', 'English'],
      areaServed: 'IR',
    },
    founder: {
      '@type': 'Person',
      '@id': `${siteUrl}/about#saeed-rajabi`,
      name: 'Saeed Rajabi',
      alternateName: ['سعید رجبی', 'برنامه نویس برتر'],
      jobTitle: 'Top Programmer',
      url: `${siteUrl}/about`,
    },
    sameAs: buildSameAs(contactContent),
    knowsAbout: [
      'Programming',
      'Software Development',
      'ASP.NET Core',
      'React',
      'Next.js',
      'Online Education',
    ],
  };

  const localBusiness = {
    '@type': 'LocalBusiness',
    '@id': `${siteUrl}/#localbusiness`,
    name: BRAND_NAME_FA,
    alternateName: [BRAND_NAME_EN, 'آموزشگاه آرکا نرم افزار'],
    url: siteUrl,
    image: `${siteUrl}${BRAND_OG_IMAGE_PATH}`,
    logo: `${siteUrl}${BRAND_ICON_PATH}`,
    telephone,
    email,
    address: {
      '@type': 'PostalAddress',
      streetAddress,
      addressLocality: 'Tehran',
      addressRegion: 'Tehran Province',
      addressCountry: 'IR',
    },
    parentOrganization: { '@id': `${siteUrl}/#organization` },
    sameAs: buildSameAs(contactContent),
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [organization, localBusiness],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
