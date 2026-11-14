import Image from 'next/image';
import type { ElementType } from 'react';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, User, BarChart3, Users, Video, Sparkles } from 'lucide-react';
import type { Seminar } from '@/types';
import { cn } from '@/lib/utils';
import { RegisterSeminarButton } from './register-seminar-button';
import { StartSeminarPaymentButton } from './start-seminar-payment-button';
import { SeminarCountdown } from './seminar-countdown';
import {
  formatSeminarDateLabel,
  formatSeminarTimeRange,
} from '@/lib/utils/seminar-datetime';

const FALLBACK_IMAGE = '/images/background/bg-1.svg';

type DictSlice = {
  home: { free: string };
  levels: Record<string, string>;
  seminarsPage: Record<string, string | undefined>;
};

interface SeminarDetailHeaderProps {
  seminar: Seminar;
  dict: DictSlice;
  lang: 'en' | 'fa';
}

export function SeminarDetailHeader({ seminar, dict, lang }: SeminarDetailHeaderProps) {
  const pageDict = dict.seminarsPage;
  const imgSrc = seminar.imageUrl || FALLBACK_IMAGE;
  const isFree = seminar.isFree === true || seminar.price === 0;
  const dateLabel = formatSeminarDateLabel(seminar.startDateTime, lang);
  const timeLabel = formatSeminarTimeRange(seminar.startDateTime, seminar.endDateTime, lang);
  const priceLabel = isFree
    ? dict.home.free
    : new Intl.NumberFormat(lang === 'fa' ? 'fa-IR' : 'en-US').format(seminar.price);
  const capacityPercent =
    seminar.capacity && seminar.capacity > 0
      ? Math.min(100, Math.round(((seminar.registeredCount ?? 0) / seminar.capacity) * 100))
      : 0;

  return (
    <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary/10 via-background to-background dark:from-primary/15 dark:via-background dark:to-card/40">
      <div className="pointer-events-none absolute -top-32 end-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 start-0 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
      <div
        className={cn(
          'container relative mx-auto grid gap-10 px-4 py-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:items-center lg:py-16',
          lang === 'fa' ? 'text-right' : 'text-left'
        )}
      >
        <div className="space-y-7">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="rounded-full px-4 py-1">{seminar.category || pageDict.liveWorkshop}</Badge>
            <Badge variant="secondary" className="rounded-full px-4 py-1">
              <Sparkles className="me-1.5 h-3.5 w-3.5" />
              {pageDict.liveOnline ?? (lang === 'fa' ? 'برگزاری زنده آنلاین' : 'Live online')}
            </Badge>
          </div>

          <div className="space-y-4">
            <h1 className="font-headline text-4xl font-black leading-tight tracking-tight md:text-5xl xl:text-6xl">
              {seminar.title}
            </h1>
            <p className="max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
              {pageDict.heroSubtitle ??
                (lang === 'fa'
                  ? 'در یک رویداد زنده و کاربردی شرکت کنید، از مدرس متخصص یاد بگیرید و مسیر یادگیری خود را حرفه‌ای‌تر ادامه دهید.'
                  : 'Join a focused live event, learn from an expert instructor, and move forward with a clearer learning path.')}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <InfoPill icon={CalendarDays} label={pageDict.date ?? (lang === 'fa' ? 'تاریخ' : 'Date')} value={dateLabel || '-'} />
            <InfoPill
              icon={Clock}
              label={pageDict.time ?? (lang === 'fa' ? 'زمان' : 'Time')}
              value={timeLabel}
            />
            <InfoPill icon={User} label={pageDict.speaker ?? (lang === 'fa' ? 'مدرس' : 'Speaker')} value={seminar.speaker || '-'} />
            <InfoPill icon={BarChart3} label={pageDict.level ?? (lang === 'fa' ? 'سطح' : 'Level')} value={dict.levels[seminar.level] ?? seminar.level} />
          </div>

          <SeminarCountdown
            date={seminar.date}
            time={seminar.time}
            startDateTime={seminar.startDateTime}
            endDateTime={seminar.endDateTime}
            isExpired={seminar.isExpired}
            lang={lang}
            labels={{
              title: pageDict.countdownTitle ?? (lang === 'fa' ? 'زمان باقی‌مانده تا شروع سمینار' : 'Time left until the seminar starts'),
              live: pageDict.countdownLive ?? (lang === 'fa' ? 'سمینار در حال برگزاری است' : 'The seminar is live'),
              ended: pageDict.countdownEnded ?? (lang === 'fa' ? 'زمان سمینار به پایان رسیده است' : 'The seminar has ended'),
              days: pageDict.countdownDays ?? (lang === 'fa' ? 'روز' : 'Days'),
              hours: pageDict.countdownHours ?? (lang === 'fa' ? 'ساعت' : 'Hours'),
              minutes: pageDict.countdownMinutes ?? (lang === 'fa' ? 'دقیقه' : 'Min'),
              seconds: pageDict.countdownSeconds ?? (lang === 'fa' ? 'ثانیه' : 'Sec'),
            }}
          />

          <div className="flex flex-col gap-3 sm:flex-row">
            {isFree ? (
              <RegisterSeminarButton
                seminarId={seminar.id}
                label={pageDict.registerFree ?? (lang === 'fa' ? 'ثبت‌نام رایگان' : 'Register free')}
                className="h-12 rounded-full px-8 text-base"
              />
            ) : (
              <StartSeminarPaymentButton
                seminarId={seminar.id}
                label={pageDict.register ?? (lang === 'fa' ? 'ثبت‌نام' : 'Register now')}
                className="h-12 rounded-full px-8 text-base"
              />
            )}
            <div className="flex items-center justify-center rounded-full border bg-background/70 px-5 py-3 text-sm font-semibold text-muted-foreground backdrop-blur sm:justify-start">
              {pageDict.price ?? (lang === 'fa' ? 'هزینه' : 'Price')}: <span className="mx-1 text-primary">{priceLabel}</span>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 rotate-3 rounded-[2rem] bg-primary/20 blur-xl" />
          <div className="relative overflow-hidden rounded-[2rem] border bg-card shadow-2xl shadow-primary/10">
            <div className="relative aspect-[4/3]">
              <Image
                src={imgSrc}
                alt={seminar.title}
                fill
                priority
                className="object-cover"
                data-ai-hint={seminar.imageHint}
                unoptimized={imgSrc.startsWith('http') && !imgSrc.includes('localhost')}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              {seminar.roomTitle && (
                <Badge className="absolute start-5 top-5 rounded-full bg-background/90 px-4 py-1.5 text-foreground backdrop-blur hover:bg-background/90">
                  <Video className="me-2 h-4 w-4 text-primary" />
                  {seminar.roomTitle}
                </Badge>
              )}
              <div className="absolute inset-x-5 bottom-5 rounded-3xl bg-background/90 p-5 shadow-lg backdrop-blur dark:bg-card/90">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{pageDict.seatsStatus ?? (lang === 'fa' ? 'ظرفیت ثبت‌نام' : 'Seats')}</p>
                    <p className="text-xl font-bold">
                      {seminar.registeredCount ?? 0}
                      {seminar.capacity != null ? ` / ${seminar.capacity}` : ''}
                    </p>
                  </div>
                  <Users className="h-9 w-9 text-primary" />
                </div>
                {seminar.capacity != null && (
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${capacityPercent}%` }} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoPill({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border bg-background/70 p-4 shadow-sm backdrop-blur dark:bg-card/70">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" />
        {label}
      </div>
      <p className="line-clamp-2 text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}
