'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Loader2, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DesktopLicenseAnalyticsPanel } from '@/components/professor/courses/desktop-license/desktop-license-analytics-panel';
import { DesktopLicenseStudentsPanel } from '@/components/professor/courses/desktop-license/desktop-license-students-panel';
import { DesktopLicenseWatermarkPanel } from '@/components/professor/courses/desktop-license/desktop-license-watermark-panel';
import { useProfessorDashboard } from '@/components/professor/dashboard/professor-dashboard-context';
import { useAuthSessionReady } from '@/lib/hooks/use-auth-session-ready';
import { getCourseById, getMyCourseById } from '@/lib/api/courses';
import { getCourseWatermarkPolicy, type CourseWatermarkPolicy } from '@/lib/api/desktop-licenses';
import { searchProfessorCourses } from '@/lib/api/professor-courses';
import { getDictValue } from '@/lib/i18n-client';
import { useLanguage } from '@/contexts/language-context';
import type { CourseQri } from '@/lib/api/types';
import type { Dictionary } from '@/types';
import { cn } from '@/lib/utils';

type Props = {
  dict: Dictionary;
  courseId: number;
};

export function ProfessorCourseDesktopLicensePageClient({ dict, courseId }: Props) {
  const router = useRouter();
  const { locale } = useLanguage();
  const { profile, loading: profileLoading } = useProfessorDashboard();
  const { isReady: authReady } = useAuthSessionReady();
  const isRtl = locale === 'fa';
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  const t = (key: string, fallback: string) => getDictValue(dict, key, fallback);

  const [course, setCourse] = React.useState<CourseQri | null>(null);
  const [watermark, setWatermark] = React.useState<CourseWatermarkPolicy | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [forbidden, setForbidden] = React.useState(false);
  const [notDesktop, setNotDesktop] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!authReady || profileLoading) return;

    setLoading(true);
    try {
      const [ownedDetail, publicDetail, listPage, watermarkPolicy] = await Promise.all([
        getMyCourseById(courseId),
        getCourseById(courseId).catch(() => null),
        searchProfessorCourses({ pageNumber: 1, pageSize: 500 }),
        getCourseWatermarkPolicy(courseId).catch(() => null),
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

      if (detail.deliveryMode !== 'desktopLicense') {
        setNotDesktop(true);
        setCourse(detail);
        return;
      }

      setCourse(detail);
      setWatermark(watermarkPolicy);
      setForbidden(false);
      setNotDesktop(false);
    } catch {
      setForbidden(true);
      setCourse(null);
    } finally {
      setLoading(false);
    }
  }, [authReady, courseId, profile?.teacherId, profileLoading]);

  React.useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-12 w-full max-w-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (forbidden || !course) {
    return (
      <div className="rounded-xl border p-8 text-center">
        <p className="text-muted-foreground">
          {t('professorDashboard.courses.notFound', 'Course not found or access denied.')}
        </p>
        <Button className="mt-4" variant="outline" onClick={() => router.push('/professor/courses')}>
          {t('professorDashboard.courses.backToList', 'Back to courses')}
        </Button>
      </div>
    );
  }

  if (notDesktop) {
    return (
      <div className={cn('space-y-4 rounded-xl border p-8 text-center', isRtl && 'text-right')}>
        <Monitor className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground">
          {isRtl
            ? 'این دوره با حالت لایسنس دسکتاپ آرکا پیکربندی نشده است.'
            : 'This course is not configured for Arka desktop license delivery.'}
        </p>
        <Button variant="outline" asChild>
          <Link href={`/professor/courses/${courseId}`}>
            {t('professorDashboard.courses.viewDetails', 'View course details')}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/professor/courses/${courseId}`}>
            <BackIcon className="h-4 w-4" />
            {t('professorDashboard.courses.backToCourse', isRtl ? 'بازگشت به دوره' : 'Back to course')}
          </Link>
        </Button>
        <div className={cn('min-w-0 flex-1', isRtl && 'text-right')}>
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-primary" />
            <h1 className="truncate text-2xl font-bold tracking-tight">
              {isRtl ? 'تنظیمات لایسنس دسکتاپ' : 'Desktop license settings'}
            </h1>
          </div>
          <p className="text-muted-foreground">{course.title}</p>
        </div>
      </div>

      <Tabs dir={locale==='fa' ? 'rtl' : 'ltr'} defaultValue="watermark" className="space-y-4">
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="watermark">{isRtl ? 'واترمارک' : 'Watermark'}</TabsTrigger>
          <TabsTrigger value="licenses">{isRtl ? 'لایسنس دانشجویان' : 'Student licenses'}</TabsTrigger>
          <TabsTrigger value="analytics">{isRtl ? 'تحلیل' : 'Analytics'}</TabsTrigger>
        </TabsList>

        <TabsContent value="watermark">
          <DesktopLicenseWatermarkPanel
            courseId={courseId}
            courseTitle={course.title}
            isRtl={isRtl}
            initialPolicy={watermark}
            onSaved={setWatermark}
          />
        </TabsContent>

        <TabsContent value="licenses">
          <DesktopLicenseStudentsPanel
            courseId={courseId}
            isRtl={isRtl}
            sections={course.sections ?? []}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <DesktopLicenseAnalyticsPanel courseId={courseId} isRtl={isRtl} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
