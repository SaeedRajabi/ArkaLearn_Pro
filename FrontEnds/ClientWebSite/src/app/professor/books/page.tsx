import type { Metadata } from 'next';

import { cookies } from 'next/headers';

import { getDictionary } from '@/lib/i18n';

import { buildPageMetadata } from '@/lib/seo';

import { ProfessorBooksPageClient } from '@/components/professor/books/professor-books-page-client';



export const metadata: Metadata = buildPageMetadata({

  title: 'کتاب‌های استاد',

  description: 'مدیریت کتاب‌های منتشرشده استاد',

  path: '/professor/books',

  noIndex: true,

});



export default async function ProfessorBooksPage() {

  const cookieStore = await cookies();

  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';

  const dict = await getDictionary(lang);

  return <ProfessorBooksPageClient dict={dict} />;

}

