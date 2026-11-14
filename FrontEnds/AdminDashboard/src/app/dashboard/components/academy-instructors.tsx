'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLanguage } from '@/components/language-provider';
import type { DashboardTopInstructor } from '@/services/dashboard-service';
import { Skeleton } from '@/components/ui/skeleton';
import { resolveUserAvatarUrl } from '@/lib/default-user-avatar';

function initials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  const a = p[0]?.[0]?.toUpperCase() ?? '?';
  const b = p[1]?.[0]?.toUpperCase() ?? '';
  return a + b;
}

interface AcademyInstructorsProps {
  instructors: DashboardTopInstructor[];
  loading?: boolean;
}

export function AcademyInstructors({ instructors, loading }: AcademyInstructorsProps) {
  const { t } = useLanguage();

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
        <div>
          <CardTitle>{t('instructors_title')}</CardTitle>
          <CardDescription>{t('instructors_description_db')}</CardDescription>
        </div>
        <Button variant="link" size="sm" className="shrink-0" asChild>
          <Link href="/dashboard/courses">{t('view_all')}</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <ul className="space-y-4">
            {[1, 2, 3].map((i) => (
              <li key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-52" />
                </div>
                <Skeleton className="h-9 w-16" />
              </li>
            ))}
          </ul>
        ) : instructors.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('instructors_empty')}</p>
        ) : (
          <ul className="space-y-4">
            {instructors.map((inst) => {
              const img = resolveUserAvatarUrl(inst.avatarUrl);
              const rating =
                inst.averageCourseRating != null ? inst.averageCourseRating.toFixed(1) : '—';
              return (
                <li key={inst.teacherId} className="flex flex-wrap items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={img} alt="" />
                    <AvatarFallback>{initials(inst.displayName)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{inst.displayName}</p>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span>
                        {inst.publishedCourseCount} {t('courses_label')}
                      </span>
                      <span className="text-yellow-500 flex items-center gap-1">
                        <Star className="h-4 w-4 shrink-0" fill="currentColor" /> {rating}/5
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild className="shrink-0">
                    <Link href={`/dashboard/users/${inst.userId}`}>{t('view')}</Link>
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
