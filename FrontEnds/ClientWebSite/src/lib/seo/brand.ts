/** Central brand strings for SEO, PWA, JSON-LD, and social previews. */

/** Primary Persian name — shown first in Google site name when configured correctly. */
export const BRAND_NAME_FA = 'آرکا نرم افزار';

/** English brand */
export const BRAND_NAME_EN = 'ArkaSoftware';

/** Bilingual label for titles and Open Graph siteName */
export const BRAND_NAME_BILINGUAL = `${BRAND_NAME_FA} | ${BRAND_NAME_EN}`;

export const BRAND_TAGLINE_FA =
  'آموزش آنلاین برنامه‌نویسی — دوره‌ها، سمینارها و مقالات تخصصی';

export const BRAND_TAGLINE_EN =
  'Online programming education — courses, seminars, and expert articles';

export const BRAND_DESCRIPTION_FA =
  'پلتفرم آنلاین یادگیری برنامه‌نویسی و فناوری. دوره‌ها، سمینارها و مقالات تخصصی با بهترین اساتید.';

/** Default homepage / root title */
export const BRAND_DEFAULT_TITLE = `${BRAND_NAME_BILINGUAL} — ${BRAND_TAGLINE_FA}`;

export const BRAND_ALTERNATE_NAMES = [
  BRAND_NAME_FA,
  BRAND_NAME_EN,
  'آموزشگاه آرکا نرم افزار',
  'دانشکده آنلاین آرکا نرم افزار',
  'Arka Norm Software',
  'آرکا نرم‌افزار',
] as const;

/**
 * User-provided originals in /public/brand — never overwrite these files.
 * Place your assets here: favicon.png, android-icon-foreground.png, etc.
 */
export const BRAND_DIR = '/brand';
export const BRAND_FAVICON_PNG = `${BRAND_DIR}/favicon.png`;
export const BRAND_FOREGROUND_PNG = `${BRAND_DIR}/android-icon-foreground.png`;
export const BRAND_BACKGROUND_PNG = `${BRAND_DIR}/android-icon-background.png`;
export const BRAND_MONOCHROME_PNG = `${BRAND_DIR}/android-icon-monochrome.png`;

/** Generated derivatives (same design, resized) — run npm run brand:sync */
export const BRAND_ICON_PATH = `${BRAND_DIR}/icon-512.png`;
export const BRAND_ICON_192_PATH = `${BRAND_DIR}/icon-192.png`;
export const BRAND_APPLE_TOUCH_PATH = `${BRAND_DIR}/apple-touch-icon.png`;
export const BRAND_FAVICON_PATH = `${BRAND_DIR}/favicon.ico`;
export const BRAND_OG_IMAGE_PATH = `${BRAND_DIR}/og-image.png`;

/** Default icon for header, JSON-LD fallbacks, notifications */
export function getBrandIconUrl(size: 'favicon' | '192' | '512' = '192'): string {
  if (size === 'favicon') return BRAND_FAVICON_PNG;
  if (size === '512') return BRAND_ICON_PATH;
  return BRAND_ICON_192_PATH;
}
