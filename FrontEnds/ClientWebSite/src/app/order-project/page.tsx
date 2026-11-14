import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { getClusterKeywords } from '@/lib/seo/keyword-clusters';
import { OrderProjectForm } from '@/components/features/project-orders/order-project-form';

export const metadata: Metadata = buildPageMetadata({
  title: 'سفارش پروژه نرم‌افزاری',
  description:
    'سفارش طراحی و توسعه نرم‌افزار، وب‌اپلیکیشن و API توسط تیم متخصص آرکا نرم‌افزار. مشاوره رایگان و تحویل پروژه‌محور.',
  path: '/order-project',
  keywordsExtra: getClusterKeywords('orderProject', 'brand', 'projects'),
});

export default async function OrderProjectPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);

  return <OrderProjectForm dict={dict} lang={lang} />;
}
