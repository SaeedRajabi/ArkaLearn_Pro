import type {NextConfig} from 'next';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

function normalizeApiServiceUrl(rawValue: string): string {
  const value = rawValue.replace(/\/+$/, '');

  if (/\/api\/service$/i.test(value)) {
    return value;
  }

  if (/\/api$/i.test(value)) {
    return `${value}/Service`;
  }

  return `${value}/api/Service`;
}

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    middlewareClientMaxBodySize: '1536mb',
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/manifest.json',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), display-capture=(self), geolocation=(), payment=(), usb=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.arkasoftware.ir',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '5001',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '4001',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4001',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '127.0.0.1',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    // Proxy API requests to the backend (browser uses /svc/Service on the dashboard origin).
    const defaultApiUrl =
      process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://api.arkasoftware.ir';
    let apiUrl = (
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      defaultApiUrl
    )
      .trim()
      .replace(/\/$/, '');

    try {
      const parsed = new URL(apiUrl.includes('://') ? apiUrl : `http://${apiUrl}`);
      if (apiUrl.includes('://')) {
        apiUrl = parsed.origin;
      }
    } catch {
      /* keep apiUrl as-is */
    }

    const apiServiceUrl = normalizeApiServiceUrl(apiUrl);

    return [
      // /hubs/project-qa and /meetingHub are handled by app route handlers (not rewrites).
      // /svc/Service is handled by app/svc/Service/[...path]/route.ts (supports local HTTPS dev cert)
      {
        // پراکسی کردن تمام درخواست‌های API
        source: '/api/Service/:path*',
        destination: `${apiServiceUrl}/:path*`,
      },
      {
        // همان پراکسی برای مسیر با حروف کوچک (مطابق .env محلی و جلوگیری از عدم تطابق rewrite)
        source: '/api/service/:path*',
        destination: `${apiServiceUrl}/:path*`,
      },
      {
        // پراکسی کردن تصاویر سمینارها
        source: '/api/seminars/image/:path*',
        destination: `${apiUrl}/api/seminars/image/:path*`,
      },
      {
        // پراکسی کردن تصاویر مقالات
        source: '/api/images/articles/:path*',
        destination: `${apiUrl}/api/images/articles/:path*`,
      },
      {
        source: '/images/:path*',
        destination: `${apiUrl}/images/:path*`,
      },
      {
        source: '/audio/:path*',
        destination: `${apiUrl}/audio/:path*`,
      },
      {
        source: '/videos/:path*',
        destination: `${apiUrl}/videos/:path*`,
      },
      {
        source: '/media/:path*',
        destination: `${apiUrl}/media/:path*`,
      },
      {
        // پراکسی کلی برای هر فایلی که در پوشه images بک‌اند باشد (محض احتیاط)
        source: '/api/images/:path*',
        destination: `${apiUrl}/api/images/:path*`,
      }
    ];
  },
};

export default nextConfig;
