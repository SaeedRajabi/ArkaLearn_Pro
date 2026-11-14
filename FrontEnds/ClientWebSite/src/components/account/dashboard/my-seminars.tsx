'use client';

import { useState, useEffect } from 'react';
import { Presentation, Link as LinkIcon, User, CalendarDays, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { enterSeminarRoom, getMyRegisteredSeminars } from '@/lib/api/seminars';
import { getDictValue } from '@/lib/i18n-client';
import type { Dictionary, MySeminar } from '@/types';
import { appendRoomAutoLoginParams, normalizeRoomEntryUrl } from '@/lib/room-entry-url';
import { useLanguage } from '@/contexts/language-context';

export function MySeminars({ dict }: { dict: Dictionary }) {
  const [seminars, setSeminars] = useState<MySeminar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [enteringId, setEnteringId] = useState<number | null>(null);
  const { dir, locale } = useLanguage();

  useEffect(() => {
    const fetchSeminars = async () => {
      setIsLoading(true);
      try {
        const data = await getMyRegisteredSeminars();
        setSeminars(data);
      } catch (err) {
        console.error('Failed to fetch seminars:', err);
        setSeminars([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSeminars();
  }, []);

  const t = (key: string, def: string) => getDictValue(dict, key, def);
  const statusPaid = t('dashboard.mySeminars.statusPaid', 'Registered');
  const statusPending = t('dashboard.mySeminars.statusPending', 'Payment Pending');
  const accessLabel = t('dashboard.mySeminars.access', 'Access');
  const dateLabel = t('dashboard.mySeminars.date', 'Date & Time');

  const handleEnterRoom = async (seminarId: number, fallbackRoomLink?: string) => {
    setEnteringId(seminarId);
    try {
      const response = await enterSeminarRoom(seminarId);
      const roomLink = normalizeRoomEntryUrl(response.roomLink || fallbackRoomLink);
      if (!roomLink) return;

      const userData = response.userData;
      const url =
        userData?.token && userData.userId
          ? appendRoomAutoLoginParams(roomLink, {
              token: userData.token,
              userId: userData.userId,
              userName: userData.userName,
              displayName: userData.displayName ?? userData.userName,
              avatarUrl: userData.avatarUrl,
              email: userData.email,
            })
          : roomLink;
      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setEnteringId(null);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Presentation className="h-5 w-5" />
          {t('dashboard.mySeminars.title', 'My Seminars')}
        </CardTitle>
        <CardDescription>
          {t('dashboard.mySeminars.subtitle', 'Access your registered seminars and webinars.')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {seminars.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t('dashboard.mySeminars.empty', 'You have not registered for any seminars yet.')}
          </div>
        ) : (
          <div className="space-y-4">
            {seminars.map((seminar) => (
              <div key={seminar.seminarId} className="flex flex-col gap-4 rounded-lg border p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold">{seminar.seminarTitle}</h3>
                    <Badge variant={seminar.hasPaid ? 'default' : 'destructive'}>
                      {seminar.hasPaid ? statusPaid : statusPending}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4" />
                      {dateLabel}: {new Date(seminar.startTime).toLocaleDateString(locale === 'fa' ? 'fa-IR' : 'en-US')}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      {new Date(seminar.startTime).toLocaleTimeString(locale === 'fa' ? 'fa-IR' : 'en-US', { hour: '2-digit', minute: '2-digit' })} - {new Date(seminar.endTime).toLocaleTimeString(locale === 'fa' ? 'fa-IR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {seminar.roomUserName && (
                      <span className="inline-flex items-center gap-1.5">
                        <User className="h-4 w-4" />
                        {seminar.roomUserName}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={enteringId === seminar.seminarId}
                    onClick={() => handleEnterRoom(seminar.seminarId, seminar.roomLink)}
                    className="flex items-center gap-2"
                  >
                    <LinkIcon className="h-3 w-3" />
                    {enteringId === seminar.seminarId ? t('dashboard.mySeminars.entering', 'Entering...') : accessLabel}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
