import type { Metadata } from 'next';

import { cookies } from 'next/headers';

import { getDictionary } from '@/lib/i18n';

import { buildPageMetadata } from '@/lib/seo';

import { ProfessorStudentsPageClient } from '@/components/professor/students/professor-students-page-client';



export const metadata: Metadata = buildPageMetadata({

  title: 'دانشجویان استاد',

  description: 'لیست دانشجویان ثبت‌نام‌شده در دوره‌های استاد',

  path: '/professor/students',

  noIndex: true,

});



export default async function ProfessorStudentsPage() {

  const cookieStore = await cookies();

  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';

  const dict = await getDictionary(lang);

  return <ProfessorStudentsPageClient dict={dict} />;

}

