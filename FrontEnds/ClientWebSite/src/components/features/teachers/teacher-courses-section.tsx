'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, GraduationCap, PlayCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getCourseImageUrl } from '@/lib/utils/image-url';
import { getCourseUrl } from '@/lib/course-slug';
import type { TeacherProfile } from '@/types';

type Props = {
  courses: TeacherProfile['courses'];
  lang: 'en' | 'fa';
  title: string;
  emptyLabel: string;
  viewCourseLabel: string;
};

function langToLocale(lang: 'en' | 'fa'): string {
  return lang === 'fa' ? 'fa-IR' : 'en-US';
}

function formatPrice(price: number, lang: 'en' | 'fa', locale: string): string {
  if (price <= 0) return lang === 'fa' ? 'رایگان' : 'Free';
  return `${price.toLocaleString(locale)} ${lang === 'fa' ? 'تومان' : ''}`.trim();
}

export function TeacherCoursesSection({ courses, lang, title, emptyLabel, viewCourseLabel }: Props) {
  const locale = langToLocale(lang);
  const Arrow = lang === 'fa' ? ArrowLeft : ArrowRight;
  const showHeader = Boolean(title?.trim());

  const body =
    courses.length === 0 ? (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 py-12 text-center">
        <GraduationCap className="mb-3 h-10 w-10 text-muted-foreground/50" />
        <p className="text-muted-foreground">{emptyLabel}</p>
      </div>
    ) : (
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <Link
            key={course.courseId}
            href={getCourseUrl({ id: course.courseId, title: course.title })}
            className="group block overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-lg"
          >
            <div className="relative aspect-video overflow-hidden bg-muted">
              {course.thumbnailUrl ? (
                <Image
                  src={getCourseImageUrl(course.thumbnailUrl)}
                  alt={course.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-muted">
                  <PlayCircle className="h-12 w-12 text-primary/40" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <Badge
                className={cn(
                  'absolute top-3 shadow-sm',
                  lang === 'fa' ? 'left-3' : 'right-3',
                  course.price <= 0
                    ? 'border-emerald-500/30 bg-emerald-600/90 text-white hover:bg-emerald-600/90'
                    : 'border-background/20 bg-background/90 text-foreground backdrop-blur-sm hover:bg-background/90'
                )}
              >
                {formatPrice(course.price, lang, locale)}
              </Badge>
            </div>
            <div className="space-y-3 p-4">
              {course.level ? (
                <Badge variant="outline" className="text-xs font-normal">
                  {course.level}
                </Badge>
              ) : null}
              <h3 className="line-clamp-2 font-semibold leading-snug transition-colors group-hover:text-primary">
                {course.title}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto gap-1 p-0 text-primary hover:bg-transparent hover:text-primary/80"
                tabIndex={-1}
                asChild
              >
                <span>
                  {viewCourseLabel}
                  <Arrow className="h-4 w-4" />
                </span>
              </Button>
            </div>
          </Link>
        ))}
      </div>
    );

  if (!showHeader) {
    return <div className={cn(lang === 'fa' && 'text-right')}>{body}</div>;
  }

  return (
    <div className={cn(lang === 'fa' && 'text-right')}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-headline text-xl font-bold">{title}</h2>
        {courses.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            {lang === 'fa' ? `${courses.length} دوره` : `${courses.length} courses`}
          </p>
        ) : null}
      </div>
      {body}
    </div>
  );
}
