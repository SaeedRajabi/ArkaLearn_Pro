import type { Metadata } from 'next';

import { cookies } from 'next/headers';

import { getDictionary } from '@/lib/i18n';

import { buildPageMetadata } from '@/lib/seo';

import { ProfessorArticlesPageClient } from '@/components/professor/articles/professor-articles-page-client';



export const metadata: Metadata = buildPageMetadata({

  title: 'مقالات استاد',

  description: 'مدیریت مقالات استاد',

  path: '/professor/articles',

  noIndex: true,

});



export default async function ProfessorArticlesPage() {

  const cookieStore = await cookies();

  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';

  const dict = await getDictionary(lang);

  return <ProfessorArticlesPageClient dict={dict} />;

}

