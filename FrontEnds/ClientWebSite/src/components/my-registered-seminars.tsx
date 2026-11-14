'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, ExternalLink, User, Copy, Check } from 'lucide-react';
import { enterSeminarRoom, getMyRegisteredSeminars } from '@/lib/api/seminars';
import type { MySeminar } from '@/types';
import { useRouter } from 'next/navigation';
import { appendRoomAutoLoginParams, normalizeRoomEntryUrl } from '@/lib/room-entry-url';
import { cn } from '@/lib/utils';

type DictSlice = {
  title?: string;
  empty?: string;
  roomLink?: string;
  username?: string;
  passwordSentByEmail?: string;
  copy?: string;
  copied?: string;
  enterRoom?: string;
  loginRequired?: string;
};

interface MyRegisteredSeminarsProps {
  dict?: DictSlice;
  lang?: 'en' | 'fa';
}

export function MyRegisteredSeminars({ dict = {}, lang = 'fa' }: MyRegisteredSeminarsProps) {
  const [list, setList] = useState<MySeminar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [enteringId, setEnteringId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    getMyRegisteredSeminars()
      .then((data) => {
        if (!cancelled) setList(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (!cancelled) {
          const msg = e?.status === 401 ? (dict.loginRequired ?? 'لطفاً وارد شوید.') : (e?.message || 'خطا در بارگذاری.');
          setError(msg);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [dict.loginRequired]);

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'fa-IR', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return iso;
    }
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString(lang === 'en' ? 'en-US' : 'fa-IR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const buildRoomEntryUrl = (roomLink: string, response: Awaited<ReturnType<typeof enterSeminarRoom>>) => {
    const userData = response.userData;
    const normalized = normalizeRoomEntryUrl(roomLink);
    if (!userData?.token || !userData.userId) return normalized;

    return appendRoomAutoLoginParams(normalized, {
      token: userData.token,
      userId: userData.userId,
      userName: userData.userName,
      displayName: userData.displayName ?? userData.userName,
      avatarUrl: userData.avatarUrl,
      email: userData.email,
    });
  };

  const handleEnterRoom = async (item: MySeminar) => {
    setEnteringId(item.seminarId);
    try {
      const response = await enterSeminarRoom(item.seminarId);
      const roomLink = response.roomLink || item.roomLink;
      if (!roomLink) {
        throw new Error(lang === 'en' ? 'No online room is assigned to this seminar.' : 'اتاق آنلاینی برای این سمینار تعریف نشده است.');
      }
      window.open(buildRoomEntryUrl(roomLink, response), '_blank', 'noopener,noreferrer');
    } catch (e) {
      const message = e instanceof Error ? e.message : (lang === 'en' ? 'Could not enter the seminar room.' : 'امکان ورود به اتاق سمینار وجود ندارد.');
      setError(message);
    } finally {
      setEnteringId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p className="mb-4">{error}</p>
          {error.includes('وارد') && (
            <Button variant="outline" onClick={() => router.push('/login')}>
              {lang === 'en' ? 'Go to Login' : 'ورود'}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const title = dict.title ?? (lang === 'en' ? 'My Registered Seminars' : 'سمینارهای ثبت‌نام‌شده');
  const empty = dict.empty ?? (lang === 'en' ? 'You have not registered for any seminar yet.' : 'هنوز در هیچ سمیناری ثبت‌نام نکرده‌اید.');
  const roomLinkLabel = dict.roomLink ?? (lang === 'en' ? 'Online room' : 'اتاق آنلاین');
  const usernameLabel = dict.username ?? (lang === 'en' ? 'Username (email)' : 'نام کاربری (ایمیل)');
  const passwordNote = dict.passwordSentByEmail ?? (lang === 'en' ? 'Password was sent to your email.' : 'رمز ورود به ایمیل شما ارسال شده است.');
  const copyLabel = dict.copy ?? (lang === 'en' ? 'Copy' : 'کپی');
  const copiedLabel = dict.copied ?? (lang === 'en' ? 'Copied!' : 'کپی شد!');
  const enterRoomLabel = dict.enterRoom ?? (lang === 'en' ? 'Enter room' : 'ورود به اتاق');

  return (
    <div className="space-y-6">
      <h2 className="font-headline text-2xl font-bold">{title}</h2>
      {list.length === 0 ? (
        <p className="text-muted-foreground">{empty}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((item) => (
            <Card key={item.seminarId}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{item.seminarTitle}</CardTitle>
                <div className={cn('flex flex-wrap gap-4 text-sm text-muted-foreground', lang === 'fa' && 'flex-row-reverse')}>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(item.startTime)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatTime(item.startTime)} – {formatTime(item.endTime)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {item.seminarId && (
                  <div>
                    <p className="mb-1 text-sm font-medium">{roomLinkLabel}</p>
                    <div className="flex items-center gap-2">
                      <span className="flex-1 text-sm text-muted-foreground">
                        {lang === 'en'
                          ? 'Access is verified before opening the online room.'
                          : 'دسترسی شما قبل از باز شدن اتاق آنلاین بررسی می‌شود.'}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={enteringId === item.seminarId}
                        onClick={() => handleEnterRoom(item)}
                      >
                        {enteringId === item.seminarId ? (lang === 'en' ? 'Entering...' : 'در حال ورود...') : enterRoomLabel}
                        <ExternalLink className="mr-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {item.roomUserName && (
                  <div>
                    <p className="mb-1 text-sm font-medium flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {usernameLabel}
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 truncate rounded bg-muted px-2 py-1 text-xs">{item.roomUserName}</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(item.roomUserName!, item.seminarId + 10000)}
                      >
                        {copiedId === item.seminarId + 10000 ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">{passwordNote}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
