import { notFound } from 'next/navigation';

import { cookies } from 'next/headers';

import type { Metadata } from 'next';

import { getTeacherProfile } from '@/lib/api/teachers';

import { searchTeacherAdvertisements } from '@/lib/api/teacher-advertisements';

import type { TeacherProfile } from '@/types';

import { getDictionary } from '@/lib/i18n';

import { buildContentMetadata } from '@/lib/seo';

import { PageWithBreadcrumb } from '@/components/shared';

import { JsonLdBreadcrumb } from '@/components/shared/json-ld-breadcrumb';

import { JsonLdTeacherProfile } from '@/components/shared/json-ld-teacher-profile';

import { TeacherProfileView } from '@/components/features/teachers';

import { getClusterKeywords } from '@/lib/seo/keyword-clusters';



type Props = {

  params: Promise<{ username: string }>;

  searchParams: Promise<{ teacherId?: string }>;

};



async function loadTeacherProfile(username: string, teacherIdHint?: number): Promise<TeacherProfile | null> {

  const decoded = decodeURIComponent(username);

  let profile = await getTeacherProfile({ userName: decoded });

  if (profile) return profile;



  if (teacherIdHint && teacherIdHint > 0) {

    profile = await getTeacherProfile({ teacherId: teacherIdHint });

    if (profile) return profile;

  }



  const numericSlug = Number(decoded);

  if (!profile && /^\d+$/.test(decoded) && numericSlug > 0) {

    profile = await getTeacherProfile({ teacherId: numericSlug });

    if (profile) return profile;

  }



  try {

    const search = await searchTeacherAdvertisements({ search: decoded, pageSize: 20 });

    const normalized = decoded.toLowerCase();

    const match = search.items.find((item) => item.teacherUserName?.toLowerCase() === normalized);

    if (match?.teacherId > 0) {

      profile = await getTeacherProfile({ teacherId: match.teacherId });

    }

  } catch {

    /* optional fallback */

  }



  return profile;

}



export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {

  const { username } = await params;

  const { teacherId } = await searchParams;

  const teacherIdHint = teacherId ? Number(teacherId) : undefined;

  const profile = await loadTeacherProfile(username, teacherIdHint);

  if (!profile) return { robots: { index: false, follow: true } };

  const description =

    profile.longDescription?.trim().slice(0, 160) ||

    profile.shortDescription?.trim().slice(0, 160) ||

    `${profile.displayName} — instructor profile`;

  return buildContentMetadata({

    title: profile.displayName,

    description,

    path: `/teachers/${encodeURIComponent(profile.userName)}`,

    image: profile.avatarUrl,

    ogType: 'profile',

    keywordsExtra: getClusterKeywords('teachers', 'brand'),

  });

}



export default async function TeacherProfilePage({ params, searchParams }: Props) {

  const { username } = await params;

  const { teacherId } = await searchParams;

  const teacherIdHint = teacherId ? Number(teacherId) : undefined;

  const profile = await loadTeacherProfile(username, teacherIdHint);



  if (!profile) notFound();



  const cookieStore = await cookies();

  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';

  const dict = await getDictionary(lang);

  const pageDict = dict.teacherProfilePage as Record<string, string>;



  const breadcrumbs = [

    { label: lang === 'fa' ? 'خانه' : 'Home', href: '/' },

    { label: pageDict.title, href: '/teachers' },

    { label: profile.displayName, href: `/teachers/${encodeURIComponent(profile.userName)}` },

  ];



  return (

    <>

      <JsonLdTeacherProfile

        name={profile.displayName}

        userName={profile.userName}

        description={profile.shortDescription || profile.longDescription}

        image={profile.avatarUrl}

        jobTitle={profile.headline || profile.teachingCategoryName}

      />

      <JsonLdBreadcrumb
        items={breadcrumbs.map((item) => ({ name: item.label, path: item.href }))}
      />

      <PageWithBreadcrumb

      title={profile.displayName}

      subtitle={profile.shortDescription?.trim() || profile.headline || pageDict.title}

      breadcrumbs={breadcrumbs}

      dict={dict}

    >

      <TeacherProfileView

        profile={profile}

        lang={lang}

        dict={pageDict as Parameters<typeof TeacherProfileView>[0]['dict']}

      />

    </PageWithBreadcrumb>

    </>

  );

}


