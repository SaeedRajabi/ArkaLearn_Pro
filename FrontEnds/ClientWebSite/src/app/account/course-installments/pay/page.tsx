import type { Metadata } from 'next';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { buildPageMetadata } from '@/lib/seo';
import { CourseInstallmentPayClient } from './course-installment-pay-client';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = buildPageMetadata({
  title: 'پرداخت قسط دوره',
  description: 'انتقال به درگاه برای پرداخت قسط دوره.',
  path: '/account/course-installments/pay',
  noIndex: true,
});

export default async function CourseInstallmentPayPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="mb-8 text-center text-2xl font-bold">
        {lang === 'fa' ? 'پرداخت قسط دوره' : 'Pay course installment'}
      </h1>
      <Suspense
        fallback={
          <div className="mx-auto flex max-w-md justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <CourseInstallmentPayClient />
      </Suspense>
    </div>
  );
}
