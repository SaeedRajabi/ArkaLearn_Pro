import type { Metadata } from 'next';

import { cookies } from 'next/headers';

import { getDictionary } from '@/lib/i18n';

import { buildPageMetadata } from '@/lib/seo';

import { ProfessorCommentsPageClient } from '@/components/professor/comments/professor-comments-page-client';



export const metadata: Metadata = buildPageMetadata({

  title: 'دیدگاه‌های استاد',

  description: 'مدیریت دیدگاه‌های استاد',

  path: '/professor/comments',

  noIndex: true,

});



export default async function ProfessorCommentsPage() {

  const cookieStore = await cookies();

  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';

  const dict = await getDictionary(lang);

  return <ProfessorCommentsPageClient dict={dict} />;

}

