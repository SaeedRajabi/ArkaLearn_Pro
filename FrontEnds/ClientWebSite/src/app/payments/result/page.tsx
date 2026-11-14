import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { PageWithBreadcrumb } from '@/components/shared';
import { PaymentResultClient } from './payment-result-client';

export const metadata: Metadata = buildPageMetadata({
  title: 'نتیجه پرداخت',
  description: 'آرکا نرم‌افزار — نتیجه پرداخت سفارش دوره و سمینار',
  path: '/payments/result',
  noIndex: true,
});

type SearchParams = Promise<{
  status?: string;
  type?: string;
  invoiceId?: string;
  seminarId?: string;
  tariffId?: string;
  teacherId?: string;
  ref?: string;
  message?: string;
}>;

export default async function PaymentResultPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict: any = await getDictionary(lang);

  const isSuccess = params.status?.toLowerCase() === 'success';
  const title = isSuccess
    ? lang === 'en'
      ? 'Payment Successful'
      : 'پرداخت با موفقیت انجام شد'
    : lang === 'en'
      ? 'Payment Failed'
      : 'پرداخت ناموفق بود';
  const subtitle = isSuccess
    ? lang === 'en'
      ? 'Your payment result has been verified.'
      : 'نتیجه پرداخت شما با موفقیت بررسی شد.'
    : lang === 'en'
      ? 'The payment could not be completed.'
      : 'پرداخت شما نهایی نشد.';

  const breadcrumbs = [
    { label: dict.coursesPage.home, href: '/' },
    { label: lang === 'en' ? 'Payment result' : 'نتیجه پرداخت', href: '/payments/result' },
  ];

  return (
    <PageWithBreadcrumb title={title} subtitle={subtitle} breadcrumbs={breadcrumbs} dict={dict}>
      <PaymentResultClient
        status={params.status}
        type={params.type}
        invoiceId={params.invoiceId ?? null}
        seminarId={params.seminarId ?? null}
        teacherId={params.teacherId ?? null}
        reference={params.ref ?? null}
        message={params.message ?? null}
      />
    </PageWithBreadcrumb>
  );
}
