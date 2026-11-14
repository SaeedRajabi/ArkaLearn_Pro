import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/seo';
import { toRobotsDisallowPaths } from '@/lib/seo/private-routes';

export default function robots(): MetadataRoute.Robots {
  const disallowPaths = toRobotsDisallowPaths();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: disallowPaths,
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: disallowPaths,
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
