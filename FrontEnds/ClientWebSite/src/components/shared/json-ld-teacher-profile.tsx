import { siteUrl } from '@/lib/seo';
import { BRAND_ICON_PATH } from '@/lib/seo/brand';

type JsonLdTeacherProfileProps = {
  name: string;
  userName: string;
  description?: string;
  image?: string;
  jobTitle?: string;
  knowsAbout?: string[];
};

/** JSON-LD Person + ProfilePage for public teacher profiles. */
export function JsonLdTeacherProfile({
  name,
  userName,
  description,
  image,
  jobTitle = 'Programming Instructor',
  knowsAbout = ['Programming', 'Software Development', 'Web Development'],
}: JsonLdTeacherProfileProps) {
  const profileUrl = `${siteUrl}/teachers/${encodeURIComponent(userName)}`;
  const imageUrl = image?.startsWith('http')
    ? image
    : image
      ? `${siteUrl}${image.startsWith('/') ? image : `/${image}`}`
      : `${siteUrl}${BRAND_ICON_PATH}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        '@id': `${profileUrl}#webpage`,
        url: profileUrl,
        name: `${name} | Instructor Profile`,
        isPartOf: { '@id': `${siteUrl}/#website` },
        about: { '@id': `${profileUrl}#person` },
      },
      {
        '@type': 'Person',
        '@id': `${profileUrl}#person`,
        name,
        url: profileUrl,
        image: imageUrl,
        jobTitle,
        description: description?.slice(0, 300),
        worksFor: {
          '@type': 'Organization',
          '@id': `${siteUrl}/#organization`,
          name: 'ArkaSoftware | آرکا نرم افزار',
          url: siteUrl,
        },
        knowsAbout,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
