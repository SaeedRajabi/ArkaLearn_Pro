import type { Metadata } from 'next';
import {getMergedKeywords} from "@/lib/seo/keywords";
import { buildMetaDescription, toAbsoluteUrl } from '@/lib/seo/meta-helpers';
import { buildDynamicOgImageUrl } from '@/lib/seo/og-image-url';
import { buildLanguageAlternates } from '@/lib/seo/hreflang';
import { siteUrl } from '@/lib/seo/site-url';
import {
  BRAND_NAME_BILINGUAL,
  BRAND_NAME_FA,
  BRAND_DEFAULT_TITLE,
  BRAND_DESCRIPTION_FA,
  BRAND_OG_IMAGE_PATH,
  BRAND_ICON_PATH,
  BRAND_ICON_192_PATH,
  BRAND_APPLE_TOUCH_PATH,
  BRAND_FAVICON_PATH,
} from '@/lib/seo/brand';

const siteName = BRAND_NAME_FA;
const siteNameFull = BRAND_NAME_BILINGUAL;
const defaultTitle = BRAND_DEFAULT_TITLE;
const defaultDescription = BRAND_DESCRIPTION_FA;

/** Default OG asset — static brand image; dynamic fallback via opengraph-image.tsx */
export const defaultOgImage = BRAND_OG_IMAGE_PATH;

export { siteUrl } from '@/lib/seo/site-url';

export const seoConfig = {
  siteName,
  siteNameFull,
  defaultTitle,
  defaultDescription,
  siteUrl,
  locale: 'fa_IR',
  localeEn: 'en_US',
  twitterHandle: '@ArkaSoftware',
} as const;

/** متادیتای پیش‌فرض برای تمام صفحات */
export function getDefaultMetadata(): Metadata {
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: defaultTitle,
      template: `%s | ${siteNameFull}`,
    },
    description: defaultDescription,

    // ✅ از فایل جدا می‌خواند + کلی کلمه پرکاربرد اضافه شده
    keywords: getMergedKeywords([
      'آموزش برنامه نویسی وب با دات نت',
      'آموزش asp.net core پروژه محور',
      'آموزش nextjs فارسی',
      'آموزش react پروژه محور',
      'آموزش سی شارپ پیشرفته',
        'برنامه نویسی',
        'آموزش برنامه نویسی',
        'دانشکده آنلاین آرکا نرم افزار',
      'آموزش خصوصی برنامه نویسی',
      'برنامه نویسی جاوا',
      'دانشکده آنلاین آرکا نرم افزار'
    ]),

    authors: [
      { name: 'Saeed Rajabi', url: `${siteUrl}/about` },
      { name: siteName, url: siteUrl },
    ],
    creator: 'Saeed Rajabi',
    publisher: siteName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      type: 'website',
      locale: seoConfig.locale,
      alternateLocale: seoConfig.localeEn,
      siteName: siteNameFull,
      title: defaultTitle,
      description: defaultDescription,
      url: siteUrl,
      images: [
        {
          url: defaultOgImage,
          width: 1200,
          height: 630,
          alt: siteNameFull,
          type: 'image/png',
        },
        {
          url: '/opengraph-image',
          width: 1200,
          height: 630,
          alt: siteNameFull,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: defaultTitle,
      description: defaultDescription,
      creator: seoConfig.twitterHandle,
      images: [defaultOgImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },

    // ✅ بهتر: canonical نسبی (با metadataBase ترکیب می‌شود)
    alternates: {
      canonical: '/',
      languages: buildLanguageAlternates('/'),
    },
  };
}

/** متادیتا برای یک صفحه با عنوان و توضیح سفارشی */
export function buildPageMetadata({
                                    title,
                                    description,
                                    path = '',
                                    image,
                                    noIndex = false,
                                    keywordsExtra,
                                  }: {
  title: string;
  description: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
  keywordsExtra?: string[];
}): Metadata {
  const cleanPath = path
      ? path.startsWith('/') ? path : `/${path}`
      : '/';

  const urlAbs = `${siteUrl}${cleanPath}`;
  const ogImage = image
      ? (image.startsWith('http') ? image : `${siteUrl}${image.startsWith('/') ? image : `/${image}`}`)
      : `${siteUrl}${defaultOgImage}`;

  return {
    title,
    description,

    // اگر خواستی برای هر صفحه هم keyword سفارشی بدی
    keywords: getMergedKeywords(keywordsExtra),

    openGraph: {
      title,
      description,
      url: urlAbs,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: cleanPath,
      languages: buildLanguageAlternates(cleanPath),
    },
    ...(noIndex && {
      robots: { index: false, follow: true },
    }),
  };
}

export type ContentMetadataType = 'website' | 'article' | 'profile';

/** Rich metadata for articles, courses, seminars, projects, and tag pages. */
export function buildContentMetadata({
  title,
  description,
  path = '',
  image,
  noIndex = false,
  keywordsExtra,
  ogType = 'website',
  publishedTime,
  modifiedTime,
  authors,
  section,
  tags,
}: {
  title: string;
  description: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
  keywordsExtra?: string[];
  ogType?: ContentMetadataType;
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  section?: string;
  tags?: string[];
}): Metadata {
  const cleanPath = path ? (path.startsWith('/') ? path : `/${path}`) : '/';
  const plainDescription = buildMetaDescription(description, title);
  const urlAbs = `${siteUrl}${cleanPath}`;
  const ogImage = image
    ? toAbsoluteUrl(image, siteUrl)
    : `${siteUrl}${buildDynamicOgImageUrl(title, plainDescription)}`;

  const tagKeywords = (tags ?? []).filter(Boolean);
  const mergedKeywords = getMergedKeywords([
    ...(keywordsExtra ?? []),
    ...tagKeywords,
    section,
    ...(authors ?? []),
  ].filter((k): k is string => Boolean(k)));

  return {
    title,
    description: plainDescription,
    keywords: mergedKeywords,
    authors: authors?.map((name) => ({ name, url: `${siteUrl}/about` })),
    openGraph: {
      type: ogType === 'article' ? 'article' : 'website',
      locale: seoConfig.locale,
      alternateLocale: seoConfig.localeEn,
      siteName: siteNameFull,
      title,
      description: plainDescription,
      url: urlAbs,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      ...(ogType === 'article' && publishedTime
        ? { publishedTime, modifiedTime: modifiedTime ?? publishedTime }
        : {}),
      ...(section ? { section } : {}),
      ...(tagKeywords.length ? { tags: tagKeywords } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: plainDescription,
      images: [ogImage],
    },
    alternates: {
      canonical: cleanPath,
      languages: buildLanguageAlternates(cleanPath),
    },
    ...(noIndex && {
      robots: { index: false, follow: true },
    }),
  };
}
