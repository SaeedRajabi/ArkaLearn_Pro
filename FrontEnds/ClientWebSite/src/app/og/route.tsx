import { NextRequest } from 'next/server';
import { renderOgImageResponse } from '@/lib/seo/og-image';
import { isSiteLocale } from '@/lib/seo/hreflang';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const title = request.nextUrl.searchParams.get('title')?.trim() || 'ArkaSoftware';
  const description = request.nextUrl.searchParams.get('description')?.trim() || undefined;
  const localeParam = request.nextUrl.searchParams.get('locale');
  const locale = isSiteLocale(localeParam) ? localeParam : 'fa';

  return renderOgImageResponse({ title, description, locale });
}
