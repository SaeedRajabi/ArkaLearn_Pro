'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Edit, ExternalLink, Heart, MessageCircle, Monitor, Star, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ProfessorCourseForm } from '@/components/professor/courses/professor-course-form';
import { CourseCategoryBreadcrumb, normalizeCategoryPath } from '@/components/shared/course-category-breadcrumb';
import { getCourseById, getMyCourseById } from '@/lib/api/courses';
import { searchProfessorCourses } from '@/lib/api/professor-courses';
import { getCourseUrl } from '@/lib/course-slug';
import { getDictValue } from '@/lib/i18n-client';
import { getCourseImageUrl } from '@/lib/utils/image-url';
import { useLanguage } from '@/contexts/language-context';
import { useProfessorDashboard } from '@/components/professor/dashboard/professor-dashboard-context';
import { useAuthSessionReady } from '@/lib/hooks/use-auth-session-ready';
import type { CourseQri } from '@/lib/api/types';
import type { Dictionary } from '@/types';
import { cn } from '@/lib/utils';

type Props = {
  dict: Dictionary;
  courseId: number;
};

export function ProfessorCourseDetailPageClient({ dict, courseId }: Props) {
  const router = useRouter();
  const { locale } = useLanguage();
  const { profile, loading: profileLoading } = useProfessorDashboard();
  const { isReady: authReady } = useAuthSessionReady();
  const isRtl = locale === 'fa';
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  const [course, setCourse] = React.useState<CourseQri | null>(null);
  const [stats, setStats] = React.useState({ students: 0, comments: 0, likes: 0, rating: 0 });
  const [loading, setLoading] = React.useState(true);
  const [editOpen, setEditOpen] = React.useState(false);
  const [forbidden, setForbidden] = React.useState(false);

  const t = (key: string, fallback: string) => getDictValue(dict, key, fallback);

  const courseRef = React.useRef<CourseQri | null>(null);
  courseRef.current = course;

  const reload = React.useCallback(async () => {
    if (!authReady || profileLoading) {
      // Wait without blanking already-loaded content (avoids skeleton flash on auth recheck).
      if (!courseRef.current) setLoading(true);
      return;
    }

    const showSkeleton = !courseRef.current;
    if (showSkeleton) setLoading(true);
    try {
      const [ownedDetail, publicDetail, listPage] = await Promise.all([
        getMyCourseById(courseId),
        getCourseById(courseId).catch(() => null),
        searchProfessorCourses({ pageNumber: 1, pageSize: 500 }),
      ]);

      const detail = ownedDetail ?? publicDetail;
      const listItem = listPage.queryResult.find((c) => Number(c.id) === Number(courseId));
      const ownedByList = Boolean(listItem);
      const ownedByProfile =
        Boolean(profile?.teacherId) &&
        detail != null &&
        Number(detail.teacherId) === Number(profile?.teacherId);

      if (!detail || (!ownedByList && !ownedByProfile)) {
        setForbidden(true);
        setCourse(null);
        return;
      }

      setCourse(detail);
      setStats({
        students: listItem?.studentCount ?? 0,
        comments: listItem?.commentCount ?? 0,
        likes: listItem?.likeCount ?? 0,
        rating: listItem?.rating ?? detail.courseRate ?? 0,
      });
      setForbidden(false);
    } catch {
      setForbidden(true);
      setCourse(null);
    } finally {
      setLoading(false);
    }
  }, [authReady, courseId, profile?.teacherId, profileLoading]);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="aspect-video w-full max-w-3xl rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (forbidden || !course) {
    return (
      <div className="rounded-xl border p-8 text-center">
        <p className="text-muted-foreground">{t('professorDashboard.courses.notFound', 'Course not found or access denied.')}</p>
        <Button className="mt-4" variant="outline" onClick={() => router.push('/professor/courses')}>
          {t('professorDashboard.courses.backToList', 'Back to courses')}
        </Button>
      </div>
    );
  }

  const publicUrl = getCourseUrl({ id: course.courseId, slug: course.slug, title: course.title });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/professor/courses">
            <BackIcon className="h-4 w-4" />
            {t('professorDashboard.courses.backToList', 'Back to courses')}
          </Link>
        </Button>
        <div className="ms-auto flex flex-wrap gap-2">
          {course.deliveryMode === 'desktopLicense' ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/professor/courses/${courseId}/desktop`}>
                <Monitor className="h-4 w-4" />
                {t('professorDashboard.courses.desktopLicense', isRtl ? 'لایسنس دسکتاپ' : 'Desktop license')}
              </Link>
            </Button>
          ) : null}
          <Button variant="outline" size="sm" asChild>
            <Link href={publicUrl} target="_blank">
              <ExternalLink className="h-4 w-4" />
              {t('professorDashboard.courses.viewPublic', 'Public page')}
            </Link>
          </Button>
          <Button size="sm" onClick={() => setEditOpen(true)}>
            <Edit className="h-4 w-4" />
            {t('professorDashboard.courses.editCourse', 'Edit course')}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
            <Image
              src={getCourseImageUrl(course.thumbnailUrl)}
              alt={course.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className={cn(isRtl && 'text-right')}>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <CourseCategoryBreadcrumb
                path={normalizeCategoryPath(course.categoryPath, course.category)}
                fallbackName={course.category}
                isRtl={isRtl}
                size="sm"
              />
              <Badge variant={course.isPublish ? 'default' : 'outline'}>
                {course.isPublish ? (isRtl ? 'منتشر شده' : 'Published') : isRtl ? 'پیش‌نویس' : 'Draft'}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold">{course.title}</h1>
            {course.shortDescription ? (
              <p className="mt-3 text-muted-foreground">{course.shortDescription}</p>
            ) : null}
            {course.description ? (
              <div
                className="prose prose-neutral dark:prose-invert mt-6 max-w-none"
                dangerouslySetInnerHTML={{ __html: course.description }}
              />
            ) : null}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border p-5 space-y-4">
            <h2 className="font-semibold">{t('professorDashboard.courses.statsTitle', 'Statistics')}</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-muted/50 p-3">
                <Users className="mb-1 h-4 w-4 text-primary" />
                <p className="text-2xl font-bold">{stats.students}</p>
                <p className="text-muted-foreground">{t('professorDashboard.courses.students', 'Students')}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <MessageCircle className="mb-1 h-4 w-4 text-primary" />
                <p className="text-2xl font-bold">{stats.comments}</p>
                <p className="text-muted-foreground">{t('professorDashboard.courses.comments', 'Comments')}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <Heart className="mb-1 h-4 w-4 text-primary" />
                <p className="text-2xl font-bold">{stats.likes}</p>
                <p className="text-muted-foreground">{t('professorDashboard.courses.likes', 'Likes')}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <Star className="mb-1 h-4 w-4 text-amber-500" />
                <p className="text-2xl font-bold">{stats.rating.toFixed(1)}</p>
                <p className="text-muted-foreground">{t('professorDashboard.courses.rating', 'Rating')}</p>
              </div>
            </div>
            <p className="text-lg font-bold text-primary">
              {Number(course.price) <= 0
                ? t('professorDashboard.courses.free', 'Free')
                : `${Number(course.price).toLocaleString(isRtl ? 'fa-IR' : 'en-US')} ${isRtl ? 'تومان' : ''}`.trim()}
            </p>
          </div>

          {(course.sections ?? []).length > 0 ? (
            <div className="rounded-xl border p-5">
              <h2 className="mb-3 font-semibold">{t('professorDashboard.courses.curriculum', 'Curriculum')}</h2>
              <ul className="space-y-3 text-sm">
                {(course.sections ?? []).map((sec, i) => (
                  <li key={`${sec.sessionTitle}-${i}`}>
                    <p className="font-medium">{sec.sessionTitle}</p>
                    <p className="text-muted-foreground">
                      {(sec.courseLessons ?? []).length}{' '}
                      {t('professorDashboard.courses.lessons', 'lessons')}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>

      <ProfessorCourseForm
        variant="modal"
        open={editOpen}
        courseToEdit={course}
        onCancel={() => setEditOpen(false)}
        onSaved={() => {
          setEditOpen(false);
          reload();
        }}
      />
    </div>
  );
}
