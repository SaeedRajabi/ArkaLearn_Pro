'use client';

import * as React from 'react';
import { Download, Monitor, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getDictValue } from '@/lib/i18n-client';
import { checkDesktopAppUpdate, type DesktopAppUpdateInfo } from '@/lib/api/desktop-app';
import { cn } from '@/lib/utils';
import type { Dictionary } from '@/types';

type DesktopAppDownloadPanelProps = {
  dict: Dictionary;
  variant?: 'card' | 'inline' | 'compact';
  className?: string;
  /** Audience copy tone for dashboard pages */
  audience?: 'public' | 'student' | 'professor';
};

function DesktopAppCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="space-y-3">
        <Skeleton className="h-7 w-56 max-w-full" />
        <Skeleton className="h-4 w-full max-w-lg" />
        <Skeleton className="h-4 w-3/4 max-w-md" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-10 w-44" />
      </CardContent>
    </Card>
  );
}

function DesktopAppCompactSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-xl border bg-muted/30 p-3 sm:p-4',
        className
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Skeleton className="mt-0.5 h-9 w-9 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-48 max-w-full" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
      <Skeleton className="h-9 w-36" />
    </div>
  );
}

export function DesktopAppDownloadPanel({
  dict,
  variant = 'card',
  className,
  audience = 'public',
}: DesktopAppDownloadPanelProps) {
  const t = (key: string, fallback: string) => getDictValue(dict, key, fallback);
  const [loading, setLoading] = React.useState(true);
  const [info, setInfo] = React.useState<DesktopAppUpdateInfo | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const result = await checkDesktopAppUpdate('0.0.0');
      if (!cancelled) {
        setInfo(result);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const title =
    audience === 'student'
      ? t('desktopApp.download.studentTitle', 'دانلود اپلیکیشن ویندوز')
      : audience === 'professor'
        ? t('desktopApp.download.professorTitle', 'دانلود اپلیکیشن ویندوز')
        : t('desktopApp.download.title', 'اپلیکیشن ویندوز آرکا نرم‌افزار');

  const description =
    audience === 'student'
      ? t(
          'desktopApp.download.studentDescription',
          'دوره‌های دارای لایسنس دسکتاپ، کمک از راه دور و پخش امن ویدیو را با اپلیکیشن ویندوز تجربه کنید.'
        )
      : audience === 'professor'
        ? t(
            'desktopApp.download.professorDescription',
            'برای میزبانی کمک از راه دور و مدیریت تجربه یادگیری دانشجویان، اپلیکیشن ویندوز را نصب کنید.'
          )
        : t(
            'desktopApp.download.description',
            'نقطه قوت سیستم آموزش آرکا نرم‌افزار؛ یادگیری امن، لایسنس دسکتاپ و کمک از راه دور.'
          );

  const downloadLabel = t('desktopApp.download.cta', 'دانلود برای ویندوز');
  const unavailable = t(
    'desktopApp.download.unavailable',
    'نسخه منتشرشده‌ای برای دانلود در دسترس نیست.'
  );
  const versionLabel = t('desktopApp.download.version', 'نسخه');
  const windowsOnly = t('desktopApp.download.windowsOnly', 'مخصوص ویندوز');
  const securePlayback = t('desktopApp.download.securePlayback', 'پخش امن ویدیو');

  const downloadFileName = info?.latestVersion
    ? `ArkaSoftwareDesktop-${info.latestVersion}.msi`
    : 'ArkaSoftwareDesktop.msi';

  if (loading) {
    if (variant === 'inline' || variant === 'compact') {
      return <DesktopAppCompactSkeleton className={className} />;
    }
    return <DesktopAppCardSkeleton className={className} />;
  }

  const downloadButton = info?.installerUrl ? (
    <Button asChild size={variant === 'compact' ? 'sm' : 'default'} className="gap-2">
      <a href={info.installerUrl} rel="noreferrer" download={downloadFileName}>
        <Download className="h-4 w-4" />
        {downloadLabel}
        {info.latestVersion ? (
          <span className="opacity-80" dir="ltr">
            v{info.latestVersion}
          </span>
        ) : null}
      </a>
    </Button>
  ) : null;

  if (variant === 'inline' || variant === 'compact') {
    return (
      <div
        className={cn(
          'flex flex-wrap items-center gap-3 rounded-xl border bg-muted/30 p-3 sm:p-4',
          className
        )}
      >
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
            <Monitor className="h-5 w-5" />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold">{title}</p>
            {variant === 'inline' ? (
              <p className="text-xs text-muted-foreground">{description}</p>
            ) : null}
            {info?.latestVersion ? (
              <p className="text-xs text-muted-foreground" dir="ltr">
                {versionLabel} {info.latestVersion}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex w-full shrink-0 items-center justify-end sm:w-auto">
          {downloadButton ? (
            downloadButton
          ) : (
            <span className="text-xs text-muted-foreground">{unavailable}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Monitor className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Monitor className="h-3.5 w-3.5" />
            {windowsOnly}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            {securePlayback}
          </span>
          {info?.latestVersion ? (
            <span dir="ltr">
              {versionLabel} {info.latestVersion}
            </span>
          ) : null}
        </div>

        {info?.releaseNotes ? (
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{info.releaseNotes}</p>
        ) : null}

        {downloadButton ? (
          downloadButton
        ) : (
          <p className="text-sm text-muted-foreground">{unavailable}</p>
        )}
      </CardContent>
    </Card>
  );
}
