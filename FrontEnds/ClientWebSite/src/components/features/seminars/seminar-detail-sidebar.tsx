import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, BarChart3, User, Users, Video, ShieldCheck, Ticket, LockKeyhole } from 'lucide-react';
import type { Seminar } from '@/types';
import { RegisterSeminarButton } from './register-seminar-button';
import { StartSeminarPaymentButton } from './start-seminar-payment-button';
import { SeminarCountdown } from './seminar-countdown';
import { ShowVideoWithImage } from '@/components/shared/show-video-with-image-hero';
import { getSeminarIntroStreamUrl } from '@/lib/utils/seminar-media-url';
import {
  formatSeminarShortDate,
  formatSeminarTimeRange,
} from '@/lib/utils/seminar-datetime';

const FALLBACK_IMAGE = '/images/background/bg-1.svg';

type DictSlice = {
  home: { free: string };
  levels: Record<string, string>;
  seminarsPage: Record<string, string | undefined> & { register: string };
};

interface SeminarDetailSidebarProps {
  seminar: Seminar;
  dict: DictSlice;
  lang: 'en' | 'fa';
}

export function SeminarDetailSidebar({ seminar, dict, lang }: SeminarDetailSidebarProps) {
  const pageDict = dict.seminarsPage;
  const imgSrc = seminar.imageUrl || FALLBACK_IMAGE;
  const isFree = seminar.isFree === true || seminar.price === 0;
  const showPrice = isFree || seminar.price > 0;
  const canRegister = seminar.canRegister !== false && !seminar.isExpired;
  const introVideoUrl = getSeminarIntroStreamUrl(seminar.id);

  return (
    <div className="relative order-first lg:order-last">
      <div className="sticky top-24 space-y-6">
        <Card className="overflow-hidden rounded-[2rem] border-primary/10 shadow-2xl shadow-primary/10">
          <ShowVideoWithImage imageUrl={imgSrc} title={seminar.title} videoUrl={introVideoUrl} />
          <CardContent className="space-y-6 p-6">
            {showPrice && (
              <div className="rounded-3xl bg-primary/10 p-4 dark:bg-primary/15">
                <p className="text-sm font-semibold text-muted-foreground">
                  {pageDict.price ?? (lang === 'fa' ? 'هزینه شرکت در سمینار' : 'Seminar price')}
                </p>
                <p className="mt-1 text-3xl font-extrabold text-primary">
                  {seminar.price === 0
                    ? dict.home.free
                    : new Intl.NumberFormat(lang === 'fa' ? 'fa-IR' : 'en-US').format(seminar.price)}
                </p>
              </div>
            )}

            <SeminarCountdown
              date={seminar.date}
              time={seminar.time}
              startDateTime={seminar.startDateTime}
              endDateTime={seminar.endDateTime}
              isExpired={seminar.isExpired}
              lang={lang}
              compact
              labels={{
                title: pageDict.countdownTitle ?? (lang === 'fa' ? 'زمان باقی‌مانده تا شروع سمینار' : 'Time left until start'),
                live: pageDict.countdownLive ?? (lang === 'fa' ? 'سمینار در حال برگزاری است' : 'The seminar is live'),
                ended: pageDict.countdownEnded ?? (lang === 'fa' ? 'زمان سمینار به پایان رسیده است' : 'The seminar has ended'),
                days: pageDict.countdownDays ?? (lang === 'fa' ? 'روز' : 'Days'),
                hours: pageDict.countdownHours ?? (lang === 'fa' ? 'ساعت' : 'Hours'),
                minutes: pageDict.countdownMinutes ?? (lang === 'fa' ? 'دقیقه' : 'Min'),
                seconds: pageDict.countdownSeconds ?? (lang === 'fa' ? 'ثانیه' : 'Sec'),
              }}
            />

            <div className="space-y-3 rounded-3xl border bg-muted/30 p-4 dark:bg-background/30">
              {canRegister ? (
                isFree ? (
                  <RegisterSeminarButton
                    seminarId={seminar.id}
                    label={pageDict.registerFree ?? (lang === 'fa' ? 'ثبت‌نام رایگان' : 'Register free')}
                    className="h-12 w-full rounded-full text-base"
                  />
                ) : (
                  <StartSeminarPaymentButton seminarId={seminar.id} label={pageDict.register} className="h-12 w-full rounded-full text-base" />
                )
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  {seminar.isExpired || seminar.hasRecording
                    ? pageDict.countdownEnded ?? (lang === 'fa' ? 'زمان ثبت‌نام به پایان رسیده است' : 'Registration has ended')
                    : pageDict.registrationClosed ?? (lang === 'fa' ? 'ثبت‌نام بسته است' : 'Registration is closed')}
                </p>
              )}
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                {pageDict.secureRegistration ?? (lang === 'fa' ? 'ثبت‌نام امن و قابل پیگیری از پنل کاربری' : 'Secure registration tracked in your account')}
              </div>
              {(seminar.entryLink || seminar.roomLink) && (
                <div className="rounded-2xl border border-primary/20 bg-background/80 p-3 text-xs leading-6 text-muted-foreground">
                  <div className="mb-1 flex items-center justify-center gap-2 font-semibold text-foreground">
                    <LockKeyhole className="h-4 w-4 text-primary" />
                    {pageDict.roomAccessLocked ?? (lang === 'fa' ? 'دسترسی اتاق فقط بعد از ثبت‌نام' : 'Room access unlocks after registration')}
                  </div>
                  {pageDict.roomAccessFromDashboard ??
                    (lang === 'fa'
                      ? 'پس از ثبت‌نام، از داشبورد کاربری خود وارد اتاق آنلاین شوید.'
                      : 'After registration, enter the online room from your account dashboard.')}
                </div>
              )}
            </div>

            <Separator />

            <h3 className="font-headline flex items-center gap-2 text-lg font-bold">
              <Ticket className="h-5 w-5 text-primary" />
              {pageDict.thisSeminarIncludes ?? (lang === 'fa' ? 'این سمینار شامل' : 'This seminar includes')}
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {seminar.startDateTime && (
                <li className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 shrink-0 text-primary" />
                  <span>{formatSeminarShortDate(seminar.startDateTime, lang)}</span>
                </li>
              )}
              {seminar.startDateTime && (
                <li className="flex items-center gap-3">
                  <Clock className="h-5 w-5 shrink-0 text-primary" />
                  <span>{formatSeminarTimeRange(seminar.startDateTime, seminar.endDateTime, lang)}</span>
                </li>
              )}
              <li className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 shrink-0 text-primary" />
                <span>{dict.levels[seminar.level] ?? seminar.level}</span>
              </li>
              {seminar.speaker && (
                <li className="flex items-center gap-3">
                  <User className="h-5 w-5 shrink-0 text-primary" />
                  <span>{seminar.speaker}</span>
                </li>
              )}
              {(seminar.capacity != null || seminar.registeredCount != null) && (
                <li className="flex items-center gap-3">
                  <Users className="h-5 w-5 shrink-0 text-primary" />
                  <span>
                    {pageDict.capacity ?? (lang === 'fa' ? 'ظرفیت' : 'Capacity')}:{' '}
                    {seminar.registeredCount ?? 0}
                    {seminar.capacity != null ? ` / ${seminar.capacity}` : ''}
                  </span>
                </li>
              )}
              {seminar.roomTitle && (
                <li className="flex items-center gap-3">
                  <Video className="h-5 w-5 shrink-0 text-primary" />
                  <span>{seminar.roomTitle}</span>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
