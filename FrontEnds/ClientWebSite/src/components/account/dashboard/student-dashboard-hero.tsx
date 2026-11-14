'use client';

import { BookOpen, ClipboardCheck, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DashboardHeaderImageEditor } from '@/components/dashboard/dashboard-header-image-editor';
import getInitials, { avatarColors } from '@/components/shared/avatar-initializer';
import { formatCompactCount } from '@/components/professor/dashboard/professor-format';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { getDictValue } from '@/lib/i18n-client';
import { cn } from '@/lib/utils';
import { getDashboardHeaderImageUrl, resolveUserProfileImageUrl } from '@/lib/utils/image-url';
import type { Dictionary } from '@/types';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { getMyCourses } from '@/lib/api/courses';
import { getMyRegisteredSeminars } from '@/lib/api/seminars';
import { DashboardBannerImage } from '@/components/dashboard/dashboard-banner-image';
import { StudentDashboardStats } from './student-dashboard-stats';
import { useStudentDashboard } from './student-dashboard-context';
import type { DashboardView } from './student-dashboard-nav';
import './student-dashboard.css';

export function StudentDashboardHero({
  dict,
  setActiveView,
  enrolledCoursesCount = 0,
}: {
  dict: Dictionary;
  setActiveView?: (view: DashboardView) => void;
  enrolledCoursesCount?: number;
}) {
  const { user } = useAuth();
  const { profile, updateHeaderImage } = useStudentDashboard();
  const { locale } = useLanguage();
  const { resolvedTheme } = useTheme();
  const mode = resolvedTheme === 'dark' ? 'dark' : 'light';
  const isRtl = locale === 'fa';
  const localeTag = isRtl ? 'fa-IR' : 'en-US';

  const [coursesCount, setCoursesCount] = useState(enrolledCoursesCount);
  const [seminarsCount, setSeminarsCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [courses, seminars] = await Promise.all([getMyCourses(), getMyRegisteredSeminars()]);
        if (cancelled) return;
        setCoursesCount(Array.isArray(courses) ? courses.length : enrolledCoursesCount);
        setSeminarsCount(Array.isArray(seminars) ? seminars.length : 0);
      } catch {
        if (!cancelled) setCoursesCount(enrolledCoursesCount);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [enrolledCoursesCount]);

  const displayName =
    user?.fullName && user.fullName.trim() && user.fullName !== 'Not Name Not Family'
      ? user.fullName
      : profile?.displayName || user?.userName || user?.email || '';

  const headerSrc = getDashboardHeaderImageUrl(profile?.headerImageUrl);
  const points = Math.max(coursesCount * 30 + seminarsCount * 10, 0);

  return (
    <section className="student-dashboard__hero-wrap">
      <div className="container px-4">
        <DashboardBannerImage
          src={headerSrc}
          bannerClassName="student-dashboard__banner relative w-full overflow-hidden rounded-xl"
          withImageClass="student-dashboard__banner--image"
          fallbackClass="student-dashboard__banner--fallback"
          imageClassName="student-dashboard__banner-image"
        >
          <DashboardHeaderImageEditor
            dict={dict}
            translationPrefix="dashboard.headerImage"
            currentHeaderPath={profile?.headerImageUrl}
            onSave={updateHeaderImage}
            fileInputId="student-header-image-file"
          />
        </DashboardBannerImage>
      </div>

      <div className="container px-4">
        <div
          className={cn(
            'relative z-10 flex flex-col gap-5 pb-4 sm:flex-row sm:items-end sm:justify-between',
            isRtl ? 'sm:flex-row' : 'sm:flex-row-reverse'
          )}
        >
          <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-end', isRtl ? 'sm:flex-row' : 'sm:flex-row-reverse')}>
            <div className="relative shrink-0">
              <Avatar className="student-dashboard__avatar -mt-12 h-24 w-24 border-4 border-background shadow-lg sm:-mt-14 sm:h-28 sm:w-28">
                <AvatarImage
                  src={resolveUserProfileImageUrl(user?.profileImage)}
                  alt={displayName}
                  className="object-cover"
                />
                <AvatarFallback
                  style={avatarColors(displayName, mode)}
                  className={cn('text-2xl font-bold', isRtl && 'font-persian')}
                >
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <span className="student-dashboard__avatar-badge inline-flex items-center rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                {getDictValue(dict, 'dashboard.hero.professional', 'Pro')}
              </span>
            </div>

            <div className={cn('student-dashboard__profile-info space-y-2', isRtl ? 'text-right' : 'text-left')}>
              <h1 className={cn('text-2xl font-bold font-headline sm:text-3xl', isRtl && 'font-persian')}>
                {displayName}
              </h1>

              <div
                className={cn(
                  'flex flex-wrap items-center gap-4 text-sm text-muted-foreground',
                  isRtl ? 'justify-end' : 'justify-start'
                )}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-amber-500" />
                  <span className="font-semibold text-foreground">{formatCompactCount(points, localeTag)}</span>
                  <span>{getDictValue(dict, 'dashboard.hero.points', 'Points')}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-violet-500" />
                  <span>
                    {coursesCount} {getDictValue(dict, 'dashboard.hero.completedCourses', 'Completed courses')}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ClipboardCheck className="h-4 w-4 text-cyan-500" />
                  <span>
                    {seminarsCount} {getDictValue(dict, 'dashboard.hero.videos', 'Videos')}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {setActiveView ? (
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="student-dashboard__view-courses shrink-0 self-start sm:self-auto"
              onClick={() => setActiveView('my-courses')}
            >
              <BookOpen className="h-4 w-4" />
              {getDictValue(dict, 'dashboard.hero.viewMyCourses', 'View my courses')}
            </Button>
          ) : null}
        </div>

        <StudentDashboardStats dict={dict} enrolledCoursesCount={enrolledCoursesCount} />
      </div>
    </section>
  );
}
