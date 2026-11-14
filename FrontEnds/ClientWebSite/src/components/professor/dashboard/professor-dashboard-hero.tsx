'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BadgeCheck, BookOpen, GraduationCap, Plus, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import getInitials, { avatarColors } from '@/components/shared/avatar-initializer';
import { getDictValue } from '@/lib/i18n-client';
import { cn } from '@/lib/utils';
import { getTeacherHeaderImageUrl, resolveUserProfileImageUrl } from '@/lib/utils/image-url';
import type { Dictionary } from '@/types';
import { useTheme } from 'next-themes';
import { formatCompactCount } from './professor-format';
import { useProfessorDashboard } from './professor-dashboard-context';
import { ProfessorHeaderImageEditor } from './professor-header-image-editor';
import { DashboardBannerImage } from '@/components/dashboard/dashboard-banner-image';

export function ProfessorDashboardHero({ dict }: { dict: Dictionary }) {
  const pathname = usePathname();
  const hideAddCourse =
    pathname === '/professor/online-rooms' || pathname.startsWith('/professor/online-rooms/');
  const { user } = useAuth();
  const { profile } = useProfessorDashboard();
  const { locale } = useLanguage();
  const { resolvedTheme } = useTheme();
  const mode = resolvedTheme === 'dark' ? 'dark' : 'light';
  const isRtl = locale === 'fa';
  const localeTag = isRtl ? 'fa-IR' : 'en-US';

  const displayName =
    user?.fullName && user.fullName.trim() && user.fullName !== 'Not Name Not Family'
      ? user.fullName
      : profile?.displayName || user?.userName || user?.email || '';

  const headerSrc = getTeacherHeaderImageUrl(profile?.headerImageUrl);
  const isVerified = profile?.profileApprovalStatus === 'approved' || profile?.profileApprovalStatus === 'published';
  const rating = profile?.skills?.length
    ? (profile.skills.reduce((sum, skill) => sum + skill.rate, 0) / profile.skills.length / 20).toFixed(1)
    : '4.5';
  const participants = profile?.reviewCount ?? profile?.points ?? 0;
  const courseCount = profile?.publishedCourseCount ?? 0;

  return (
    <section className="professor-dashboard__hero-wrap">
      <div className="container px-4">
        <DashboardBannerImage
          src={headerSrc}
          bannerClassName="professor-dashboard__banner relative w-full overflow-hidden rounded-xl"
          withImageClass="professor-dashboard__banner--image"
          fallbackClass="professor-dashboard__banner--fallback"
          imageClassName="professor-dashboard__banner-image"
        >
          <ProfessorHeaderImageEditor dict={dict} />
        </DashboardBannerImage>
      </div>

      <div className="container px-4">
        <div
          className={cn(
            'professor-dashboard__profile-row relative z-10 flex flex-col gap-5 pb-6 sm:flex-row sm:items-end sm:justify-between',
            isRtl ? 'sm:flex-row' : 'sm:flex-row-reverse'
          )}
        >
          <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-end', isRtl ? 'sm:flex-row' : 'sm:flex-row-reverse')}>
            <Avatar className="professor-dashboard__avatar -mt-12 h-24 w-24 border-4 border-background shadow-lg sm:-mt-14 sm:h-28 sm:w-28">
              <AvatarImage src={resolveUserProfileImageUrl(user?.profileImage)} alt={displayName} className="object-cover" />
              <AvatarFallback
                style={avatarColors(displayName, mode)}
                className={cn('text-2xl font-bold', isRtl && 'font-persian')}
              >
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>

            <div className={cn('professor-dashboard__profile-info space-y-2', isRtl ? 'text-right' : 'text-left')}>
              <div className={cn('flex flex-wrap items-center gap-2', isRtl ? 'justify-end' : 'justify-start')}>
                <h1 className={cn('text-2xl font-bold font-headline sm:text-3xl', isRtl && 'font-persian')}>
                  {displayName}
                </h1>
                {isVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    <BadgeCheck className="h-4 w-4" />
                    {getDictValue(dict, 'professorDashboard.hero.verified', 'Verified')}
                  </span>
                ) : null}
              </div>

              <div
                className={cn(
                  'flex flex-wrap items-center gap-4 text-sm text-muted-foreground',
                  isRtl ? 'justify-end' : 'justify-start'
                )}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-amber-500" />
                  <span className="font-semibold text-foreground">{rating}</span>
                  <span>/5.0</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4 text-orange-500" />
                  <span>
                    {formatCompactCount(participants, localeTag)}{' '}
                    {getDictValue(dict, 'professorDashboard.hero.participants', 'participants')}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-violet-500" />
                  <span>
                    {courseCount} {getDictValue(dict, 'professorDashboard.hero.courses', 'courses')}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {!hideAddCourse ? (
            <Button asChild size="lg" className="professor-dashboard__add-course shrink-0 self-start sm:self-auto">
              <Link href="/professor/courses?add=1">
                <Plus className="h-4 w-4" />
                {getDictValue(dict, 'professorDashboard.hero.addCourse', 'Add course')}
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
