import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/seo';
import { ProfessorPlaceholderPageClient } from '@/components/professor/professor-placeholder-page-client';

export const metadata: Metadata = buildPageMetadata({
  title: 'سفارشات استاد',
  description: 'لیست سفارشات استاد',
  path: '/professor/orders',
  noIndex: true,
});

export default async function ProfessorOrdersPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);
  return (
    <ProfessorPlaceholderPageClient
      dict={dict}
      titleKey="professorDashboard.menu.orders"
      defaultTitle="Order list"
      descriptionKey="professorDashboard.placeholder.orders"
      defaultDescription="Your orders will appear here soon."
    />
  );
}
