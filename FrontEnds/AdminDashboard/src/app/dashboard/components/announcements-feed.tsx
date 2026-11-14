'use client';

import { Megaphone } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useLanguage } from '@/components/language-provider';
import type { DashboardAnnouncement } from '@/services/dashboard-service';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface AnnouncementsFeedProps {
  announcements: DashboardAnnouncement[];
  loading?: boolean;
}

export function AnnouncementsFeed({ announcements, loading }: AnnouncementsFeedProps) {
  const { t, locale } = useLanguage();

  const priorityBadge = (p: number) => {
    if (p >= 2) return <Badge variant="destructive">{t('announcements_priority_high')}</Badge>;
    if (p === 1) return <Badge variant="secondary">{t('announcements_priority_normal')}</Badge>;
    return <Badge variant="outline">{t('announcements_priority_low')}</Badge>;
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t('announcements_title')}</CardTitle>
          <CardDescription>{t('announcements_description')}</CardDescription>
        </div>
        <Megaphone className="h-5 w-5 text-muted-foreground shrink-0" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <ul className="space-y-4">
            {[1, 2].map((i) => (
              <li key={i} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full max-w-[220px]" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </li>
            ))}
          </ul>
        ) : announcements.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('announcements_empty')}</p>
        ) : (
          <ul className="space-y-4">
            {announcements.map((a) => (
              <li key={a.id} className="flex gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
                  <Megaphone className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{a.title}</p>
                    {priorityBadge(a.priority)}
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{a.body}</p>
                  {a.createdDateTime ? (
                    <p className="text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(new Date(a.createdDateTime))}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
