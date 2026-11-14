/** Routes that must not be indexed (shared by robots.txt and middleware noindex). */
export const SEO_NOINDEX_ROUTE_PREFIXES = [
  '/account',
  '/professor',
  '/checkout',
  '/forgot-password',
  '/reset-password',
  '/invoices',
  '/learning',
  '/login',
  '/maintenance',
  '/offline',
  '/payments',
  '/register',
] as const;

export function toRobotsDisallowPaths(): string[] {
  return [
    '/api/',
    '/hubs/',
    '/_next/',
    '/Logs/',
    '/server.js',
    '/sw.js',
    '/workbox-',
    ...SEO_NOINDEX_ROUTE_PREFIXES.map((route) => `${route}/`),
    ...SEO_NOINDEX_ROUTE_PREFIXES.filter((route) => route !== '/offline'),
  ];
}
