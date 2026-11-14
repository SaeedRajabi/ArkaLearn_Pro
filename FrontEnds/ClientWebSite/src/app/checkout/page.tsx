import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { CheckoutPageClient } from '@/components/checkout-page-client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildPageMetadata({
  title: 'سبد خرید',
  description: 'آرکا نرم افزار - سبد خرید و تکمیل سفارش دوره‌ها.',
  path: '/checkout',
  noIndex: true,
});

export default async function CheckoutPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);

  return (
    <div className="min-h-screen bg-slate-100/80">
      <div className="container mx-auto px-4 py-8 sm:py-10 lg:py-12">
        <CheckoutPageClient dict={dict as Record<string, unknown>} />
      </div>
    </div>
  );
}
