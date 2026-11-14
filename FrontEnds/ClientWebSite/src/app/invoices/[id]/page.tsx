import { notFound } from 'next/navigation';
import { getInvoiceById } from '@/lib/api/invoices';
import { InvoiceDetailClient } from '@/components/invoice-detail-client';
import { PageWithBreadcrumb } from '@/components/shared';
import { getDictionary } from '@/lib/i18n';
import { cookies } from 'next/headers';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InvoicePage({ params }: Props) {
  const { id } = await params;
  const invoiceId:number = parseInt(id, 10);
  
  if (isNaN(invoiceId)) {
    return notFound();
  }

  // دریافت اطلاعات فاکتور (باید کوکی احراز هویت ارسال شود که در کامپوننت کلاینت انجام می‌شود)
  // اما برای SSR نیاز به کوکی داریم.
  // راه حل: فعلاً در کلاینت دریافت می‌کنیم یا از یک کامپوننت کلاینت استفاده می‌کنیم که دیتا را بگیرد.
  
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);

  return (
    <PageWithBreadcrumb
      title="جزئیات فاکتور"
      subtitle=""
      breadcrumbs={[
        { label: 'خانه', href: '/' },
        { label: 'داشبورد', href: '/account' },
        { label: 'فاکتورها', href: '/account?view=invoices' },
        { label: `فاکتور #${id}`, href: `/invoices/${id}` },
      ]}
      dict={dict}
    >
      <div className="container mx-auto py-8">
        <InvoiceDetailClient invoiceId={invoiceId ?? 0} />
      </div>
    </PageWithBreadcrumb>
  );
}
