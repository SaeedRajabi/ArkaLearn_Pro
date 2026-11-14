import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { getDictionary } from '@/lib/i18n';
import { buildContentMetadata } from '@/lib/seo';
import { PageWithBreadcrumb } from '@/components/shared';
import { AdvertisementDetailView } from '@/components/advertisements/advertisement-detail-view';
import { TeacherPromotionalVideosSection } from '@/components/advertisements/teacher-promotional-videos-section';
import { TeacherBooksSection } from '@/components/advertisements/teacher-books-section';
import { getTeacherAdvertisement, searchTeacherAdvertisements } from '@/lib/api/teacher-advertisements';
import { getTeacherPromotionalVideos } from '@/lib/api/professor-promotional-videos';
import { getTeacherBooks } from '@/lib/api/books';
import { resolveAdvertisementSlug } from '@/lib/advertisement-routes';

type Props = { params: Promise<{ username: string }> };

async function loadAdvertisement(slug: string) {
  const lookup = resolveAdvertisementSlug(slug);

  if (lookup.teacherId) {
    return getTeacherAdvertisement({ teacherId: lookup.teacherId, forEdit: false });
  }

  if (lookup.userName) {
    let ad = await getTeacherAdvertisement({ userName: lookup.userName, forEdit: false });
    if (ad) return ad;

    try {
      const search = await searchTeacherAdvertisements({ search: lookup.userName, pageSize: 20 });
      const normalized = lookup.userName.toLowerCase();
      const match = search.items.find(
        (item) =>
          item.teacherUserName?.toLowerCase() === normalized ||
          item.teacherDisplayName?.toLowerCase() === normalized
      );
      if (match?.userId > 0) {
        ad = await getTeacherAdvertisement({ userId: match.userId, forEdit: false });
      } else if (match?.teacherId > 0) {
        ad = await getTeacherAdvertisement({ teacherId: match.teacherId, forEdit: false });
      }
      if (ad) return ad;
    } catch {
      /* optional fallback */
    }
  }

  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const ad = await loadAdvertisement(username);
  if (!ad) return { robots: { index: false, follow: true } };
  const slug = ad.teacherUserName?.trim() || String(ad.teacherId || username);
  return buildContentMetadata({
    title: ad.seoTitle?.trim() || ad.title,
    description: ad.metaDescription?.trim() || ad.workExperience?.slice(0, 160) || ad.title,
    path: `/advertisements/${encodeURIComponent(slug)}`,
    image: ad.ogImageUrl || ad.teacherAvatarUrl,
  });
}

export default async function AdvertisementDetailPage({ params }: Props) {
  const { username } = await params;
  const ad = await loadAdvertisement(username);

  if (!ad) notFound();

  let listStats = {
    points: 0,
    reviewCount: 0,
    likeCount: 0,
    memberSinceUtc: undefined as string | undefined,
    subjectNames: undefined as string | undefined,
  };

  try {
    const searchTerm = ad.teacherUserName || ad.teacherDisplayName || decodeURIComponent(username);
    const search = await searchTeacherAdvertisements({ search: searchTerm, pageSize: 20 });
    const match = search.items.find(
      (i) => i.id === ad.id || i.teacherUserName === ad.teacherUserName
    );
    if (match) {
      listStats = {
        points: match.points,
        reviewCount: match.reviewCount,
        likeCount: match.likeCount,
        memberSinceUtc: match.memberSinceUtc,
        subjectNames: match.subjectNames,
      };
    }
  } catch {
    /* stats optional */
  }

  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);
  const pageDict = dict.advertisementDetailPage as Record<string, string>;
  const listDict = dict.advertisementsPage as Record<string, string>;

  const slug = ad.teacherUserName?.trim() || String(ad.teacherId || decodeURIComponent(username));

  let promotionalVideos: Awaited<ReturnType<typeof getTeacherPromotionalVideos>> = [];
  let teacherBooks: Awaited<ReturnType<typeof getTeacherBooks>> = [];
  try {
    if (ad.teacherId > 0) {
      promotionalVideos = await getTeacherPromotionalVideos({ teacherId: ad.teacherId });
      teacherBooks = await getTeacherBooks({ teacherId: ad.teacherId });
    } else if (ad.teacherUserName) {
      promotionalVideos = await getTeacherPromotionalVideos({ userName: ad.teacherUserName });
      teacherBooks = await getTeacherBooks({ userName: ad.teacherUserName });
    }
  } catch {
    /* optional */
  }

  const breadcrumbs = [
    { label: pageDict.home, href: '/' },
    { label: pageDict.list, href: '/advertisements' },
    { label: ad.teacherDisplayName || ad.title, href: `/advertisements/${encodeURIComponent(slug)}` },
  ];

  return (
    <PageWithBreadcrumb
      title={ad.title}
      subtitle={ad.teacherDisplayName ?? ''}
      breadcrumbs={breadcrumbs}
      dict={dict}
    >
      <div className="space-y-8">
        <AdvertisementDetailView
          ad={ad}
          stats={listStats}
          dict={{
            ...pageDict,
            lang,
            days: listDict.days,
            months: listDict.months,
            years: listDict.years,
          }}
        />
        <TeacherPromotionalVideosSection
          teacherId={ad.teacherId}
          userName={ad.teacherUserName}
          initialVideos={promotionalVideos}
          dict={pageDict}
        />
        <TeacherBooksSection
          teacherId={ad.teacherId}
          userName={ad.teacherUserName}
          initialBooks={teacherBooks}
          dict={pageDict}
        />
      </div>
    </PageWithBreadcrumb>
  );
}
