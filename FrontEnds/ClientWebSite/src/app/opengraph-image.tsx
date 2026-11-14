import { renderOgImageResponse } from '@/lib/seo/og-image';
import { BRAND_NAME_BILINGUAL, BRAND_TAGLINE_FA } from '@/lib/seo/brand';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const alt = BRAND_NAME_BILINGUAL;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  return renderOgImageResponse({
    title: BRAND_NAME_BILINGUAL,
    description: BRAND_TAGLINE_FA,
    locale: 'fa',
  });
}
