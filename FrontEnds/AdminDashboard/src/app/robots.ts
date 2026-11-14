import type { MetadataRoute } from 'next';

/** Admin dashboard must not appear in public search results */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      disallow: '/',
    },
  };
}
