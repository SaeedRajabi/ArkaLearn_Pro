import { ImageResponse } from 'next/og';
import fs from 'fs';
import path from 'path';
import {
  BRAND_NAME_BILINGUAL,
  BRAND_NAME_EN,
  BRAND_NAME_FA,
  BRAND_TAGLINE_FA,
  BRAND_TAGLINE_EN,
} from '@/lib/seo/brand';

export { buildDynamicOgImageUrl } from '@/lib/seo/og-image-url';

export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

const VAZIRMATN_TTF_URL =
  'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/ttf/Vazirmatn-Bold.ttf';

function loadBrandIconDataUrl(): string | null {
  try {
    const iconPath = path.join(process.cwd(), 'public', 'brand', 'favicon.png');
    const buffer = fs.readFileSync(iconPath);
    return `data:image/png;base64,${buffer.toString('base64')}`;
  } catch {
    return null;
  }
}

type OgImageContentProps = {
  title: string;
  description?: string;
  locale?: 'fa' | 'en';
  usePersianText?: boolean;
  brandIconSrc?: string | null;
};

function OgImageContent({
  title,
  description,
  locale = 'fa',
  usePersianText = false,
  brandIconSrc,
}: OgImageContentProps) {
  const isFa = locale === 'fa' && usePersianText;
  const tagline = description?.trim() || (isFa ? BRAND_TAGLINE_FA : BRAND_TAGLINE_EN);
  const displayTitle = title?.trim() || BRAND_NAME_BILINGUAL;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '64px 72px',
        background: 'linear-gradient(135deg, #e8f4fc 0%, #dbeafe 50%, #0ea5e9 140%)',
        color: '#0f172a',
        fontFamily: isFa ? 'Vazirmatn' : 'sans-serif',
        direction: isFa ? 'rtl' : 'ltr',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        {brandIconSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={brandIconSrc}
            alt=""
            width={88}
            height={88}
            style={{ borderRadius: 20, flexShrink: 0 }}
          />
        ) : (
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 20,
              background: 'linear-gradient(145deg, #0ea5e9, #0284c7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              fontWeight: 700,
              color: '#ffffff',
              flexShrink: 0,
            }}
          >
            A
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 38, fontWeight: 700 }}>{BRAND_NAME_FA}</div>
          <div style={{ fontSize: 28, opacity: 0.9 }}>{BRAND_NAME_EN}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: '92%' }}>
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            lineHeight: 1.25,
            letterSpacing: isFa ? 0 : -1,
          }}
        >
          {displayTitle}
        </div>
        <div style={{ fontSize: 28, lineHeight: 1.5, opacity: 0.92 }}>{tagline}</div>
      </div>

      <div style={{ fontSize: 22, opacity: 0.75 }}>arkasoftware.ir</div>
    </div>
  );
}

async function loadPersianTtfFont(): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(VAZIRMATN_TTF_URL, {
      next: { revalidate: 60 * 60 * 24 * 7 },
    });
    if (!response.ok) return null;
    return response.arrayBuffer();
  } catch {
    return null;
  }
}

function containsPersian(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

/** Render OG/Twitter card — uses TTF for Persian; falls back to English layout if font unavailable. */
export async function renderOgImageResponse(options: OgImageContentProps): Promise<ImageResponse> {
  const brandIconSrc = loadBrandIconDataUrl();
  const wantsPersian = options.locale !== 'en' || containsPersian(options.title) || containsPersian(options.description ?? '');
  const fontData = wantsPersian ? await loadPersianTtfFont() : null;
  const usePersianText = Boolean(fontData && wantsPersian);

  const safeOptions: OgImageContentProps = {
    ...options,
    brandIconSrc,
    locale: usePersianText ? 'fa' : 'en',
    title: usePersianText ? options.title : options.title,
    description: usePersianText ? options.description : options.description ?? BRAND_TAGLINE_EN,
    usePersianText,
  };

  if (!usePersianText && wantsPersian) {
    safeOptions.title = options.title.replace(/[^\x00-\x7F]/g, ' ').trim() || 'ArkaSoftware';
    safeOptions.description = BRAND_TAGLINE_EN;
  }

  const fonts = fontData
    ? [{ name: 'Vazirmatn', data: fontData, style: 'normal' as const, weight: 700 as const }]
    : undefined;

  return new ImageResponse(<OgImageContent {...safeOptions} />, {
    ...OG_IMAGE_SIZE,
    fonts,
  });
}
