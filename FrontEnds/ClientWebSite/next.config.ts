import type { NextConfig } from 'next';

// در محیط توسعه، خطای گواهی SSL خودامضا را نادیده می‌گیریم (این خط باید در بالاترین سطح باشد)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pwaDisabled =
  process.env.DISABLE_PWA === 'true' ||
  process.env.NEXT_PUBLIC_DISABLE_PWA === 'true';

// Some Windows/IIS environments emit noisy webpack persistent-cache snapshot warnings.
// Disable the filesystem cache there to keep production build logs clean.
const disableWebpackPersistentCache =
  process.env.DISABLE_WEBPACK_FS_CACHE === 'true' ||
  (process.platform === 'win32' && process.env.NODE_ENV === 'production');

function normalizeBackendOrigin(rawBaseUrl: string): string {
  const raw = rawBaseUrl.trim();
  if (!raw) return 'https://api.arkasoftware.ir';

  try {
    const url = new URL(raw);
    const normalizedPath = (url.pathname || '')
      .replace(/\/api(?:\/service)?\/?$/i, '')
      .replace(/\/+$/, '');

    return `${url.protocol}//${url.host}${normalizedPath}`;
  } catch {
    return raw.replace(/\/api(?:\/service)?\/?$/i, '').replace(/\/+$/, '');
  }
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: pwaDisabled,
  buildExcludes: [/middleware-manifest\.json$/],
  cacheOnFrontendNav: false,
  fallbacks: {
    document: '/offline',
  },
  workboxOptions: {
    navigateFallbackDenylist: [
      /^\/api\//,
      /^\/_next\//,
      /^\/seminars\/image\//,
      /^\/images\/articles\//,
      /^\/Images\/articles\//,
      /^\/images\//,
      /^\/Images\//,
      /^\/users\//,
    ],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts',
          expiration: { maxEntries: 4, maxAgeSeconds: 365 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'unsplash-images',
          expiration: { maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 },
        },
      },
    ],
  },
});

const useImageProxy = process.env.NEXT_PUBLIC_IMAGE_PROXY !== 'false';
const useBuiltinOptimizer = process.env.NEXT_PUBLIC_BUILTIN_IMAGE_OPTIMIZER === 'true';
const imageLoaderFile = './src/lib/image-loader.ts';

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  ...(useImageProxy
    ? {
        // Turbopack on Windows does not pick up images.loaderFile automatically.
        turbopack: {
          resolveAlias: {
            'next/dist/shared/lib/image-loader': imageLoaderFile,
          },
        },
      }
    : {}),
  images: {
    unoptimized: !useImageProxy && !useBuiltinOptimizer,
    ...(useImageProxy
      ? {
          loader: 'custom',
          loaderFile: imageLoaderFile,
        }
      : {}),
    ...(useBuiltinOptimizer && !useImageProxy
      ? {
          formats: ['image/avif', 'image/webp'],
        }
      : {}),
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'api.arkasoftware.ir', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'msg.arkasoftware.ir', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'arkasoftware.ir', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'www.arkasoftware.ir', port: '', pathname: '/**' },
    ],
  },
  webpack(config, { dev }) {
    if (!dev && disableWebpackPersistentCache) {
      config.cache = false;
    }
    return config;
  },
  async redirects() {
    return [
      {
        source: '/sitemap',
        destination: '/site-map',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    const defaultApiUrl = 'https://api.arkasoftware.ir';
    const defaultStaticUrl = 'https://msg.arkasoftware.ir';
    const apiUrl = normalizeBackendOrigin(process.env.NEXT_PUBLIC_API_URL || defaultApiUrl);
    const staticUrl = normalizeBackendOrigin(
      process.env.NEXT_PUBLIC_STATIC_ASSET_BASE_URL || defaultStaticUrl,
    );

    // Rewrites returned as a plain array behave like `afterFiles`: they run
    // after static files but BEFORE dynamic routes. The project media proxy
    // used to live there and swallowed /projects/<slug> requests, proxying
    // them to the static host instead of rendering /projects/[slug].
    // It now runs as a `fallback` rewrite — only when no page/dynamic route
    // matched — so app routes always win over static-asset proxies.
    return {
      beforeFiles: [],
      afterFiles: [
        {
          source: '/public/:path*',
          destination: `${staticUrl}/public/:path*`,
        },
        // Keep local Next.js public assets (do not proxy site chrome images to msg).
        {
          source: '/images/:path((?!background(?:/|$)|placeholders(?:/|$)|article-banner\\.jpg$).*)',
          destination: `${staticUrl}/public/images/:path*`,
        },
        {
          source: '/Images/:path*',
          destination: `${staticUrl}/public/images/:path*`,
        },
        // Only proxy static seminar media — do NOT catch app routes like /seminars or /seminars/1.
        {
          source: '/seminars/image/:path*',
          destination: `${staticUrl}/public/seminars/image/:path*`,
        },
        {
          source: '/seminars/video/:path*',
          destination: `${staticUrl}/public/seminars/video/:path*`,
        },
        {
          source: '/Seminars/image/:path*',
          destination: `${staticUrl}/public/seminars/image/:path*`,
        },
        {
          source: '/videos/:path*',
          destination: `${staticUrl}/public/videos/:path*`,
        },
        {
          source: '/media/:path*',
          destination: `${staticUrl}/public/media/:path*`,
        },
        {
          source: '/files/:path*',
          destination: `${staticUrl}/public/files/:path*`,
        },
        {
          // Non-static API-ish paths still go to API when needed.
          source: '/article/:path*',
          destination: `${apiUrl}/article/:path*`,
        },
        {
          source: '/course/:path*',
          destination: `${apiUrl}/course/:path*`,
        },
        {
          source: '/seminar/:path*',
          destination: `${apiUrl}/seminar/:path*`,
        },
      ],
      fallback: [
        {
          // Static project media on the storage host (e.g. /projects/video/intro.mp4).
          // Must never shadow the /projects/[slug] detail page.
          source: '/projects/:path*',
          destination: `${staticUrl}/public/projects/:path*`,
        },
      ],
    };
  },
};

export default withPWA(nextConfig);
