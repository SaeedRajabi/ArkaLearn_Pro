'use client';

import Image from 'next/image';
import {
  PlayCircle,
  FileText,
  Star,
  Users,
  MessageCircle,
  AtSign,
  BookOpen,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import getInitials, { avatarColors } from '@/components/shared/avatar-initializer';
import { cn } from '@/lib/utils';
import { getUserImageUrl } from '@/lib/utils/image-url';
import { FollowTeacherButton } from '@/components/features/teachers/follow-teacher-button';
import type { TeacherProfile } from '@/types';

type Props = {
  profile: TeacherProfile;
  lang: 'en' | 'fa';
  dict: {
    courses: string;
    articles: string;
    points: string;
    students?: string;
    reviews?: string;
  };
  mode: 'light' | 'dark';
};

function langToLocale(lang: 'en' | 'fa'): string {
  return lang === 'fa' ? 'fa-IR' : 'en-US';
}

export function TeacherProfileHero({ profile, lang, dict, mode }: Props) {
  const locale = langToLocale(lang);
  const hasBanner = Boolean(profile.headerImageUrl?.trim());
  const studentsLabel = dict.students ?? (lang === 'fa' ? 'دانشجو' : 'Students');
  const reviewsLabel = dict.reviews ?? (lang === 'fa' ? 'نظر' : 'Reviews');

  const stats = [
    {
      icon: PlayCircle,
      value: profile.publishedCourseCount,
      label: dict.courses,
      accent: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      icon: FileText,
      value: profile.publishedArticleCount,
      label: dict.articles,
      accent: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-500/10',
    },
    {
      icon: Star,
      value: profile.points.toLocaleString(locale),
      label: dict.points,
      accent: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      icon: Users,
      value: profile.studentCount.toLocaleString(locale),
      label: studentsLabel,
      accent: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      icon: MessageCircle,
      value: profile.reviewCount.toLocaleString(locale),
      label: reviewsLabel,
      accent: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-500/10',
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card shadow-md">
      <div className="relative h-36 sm:h-44 md:h-52">
        {hasBanner ? (
          <Image
            src={getUserImageUrl(profile.headerImageUrl)}
            alt=""
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      <div className="relative px-6 pb-6 pt-0">
        <div
          className={cn(
            'flex flex-col gap-6 md:flex-row md:items-end',
            lang === 'fa' ? 'md:flex-row-reverse md:text-right' : 'md:text-left'
          )}
        >
          <Avatar className="-mt-14 h-28 w-28 shrink-0 border-4 border-background shadow-lg ring-2 ring-primary/20 sm:h-32 sm:w-32 md:-mt-16">
            <AvatarImage
              src={getUserImageUrl(profile.avatarUrl) || undefined}
              alt={profile.displayName}
              className="object-cover"
            />
            <AvatarFallback
              style={avatarColors(profile.displayName, mode)}
              className={cn('text-3xl font-bold', lang === 'fa' && 'font-persian')}
            >
              {getInitials(profile.displayName)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-3 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              {profile.teachingCategoryName ? (
                <Badge variant="secondary" className="gap-1 font-normal">
                  <BookOpen className="h-3.5 w-3.5" />
                  {profile.teachingCategoryName}
                </Badge>
              ) : null}
              {profile.userName ? (
                <Badge variant="outline" className="gap-1 font-normal text-muted-foreground">
                  <AtSign className="h-3.5 w-3.5" />
                  {profile.userName}
                </Badge>
              ) : null}
            </div>
            <h1 className="font-headline text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
              {profile.displayName}
            </h1>
            {(profile.shortDescription?.trim() || profile.headline?.trim()) ? (
              <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
                {profile.shortDescription?.trim() || profile.headline}
              </p>
            ) : null}
            <FollowTeacherButton
              teacherId={profile.teacherId}
              teacherUserId={profile.userId}
              initialIsFollowing={profile.isFollowing}
              lang={lang}
              className="w-fit"
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-3 rounded-xl border bg-background/80 p-3 transition-colors hover:border-primary/20 hover:bg-muted/40"
            >
              <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', stat.bg)}>
                <stat.icon className={cn('h-5 w-5', stat.accent)} />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold leading-none tabular-nums">{stat.value}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
