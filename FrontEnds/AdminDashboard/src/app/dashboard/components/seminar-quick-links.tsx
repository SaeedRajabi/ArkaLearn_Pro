'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, GraduationCap, DoorOpen } from 'lucide-react';
import { useLanguage } from '@/components/language-provider';

export function SeminarQuickLinks() {
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {t('nav_rooms')} &amp; {t('nav_seminar_students')}
        </CardTitle>
        <DoorOpen className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <CardDescription>{t('seminar_quick_links_description')}</CardDescription>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href="/dashboard/rooms" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              {t('nav_rooms')}
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href="/dashboard/students" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              {t('nav_seminar_students')}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
