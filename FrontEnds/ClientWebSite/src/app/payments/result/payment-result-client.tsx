'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, CircleX, GraduationCap, LayoutDashboard, BookOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';

type Props = {
  status?: string;
  type?: string;
  invoiceId?: string | null;
  seminarId?: string | null;
  teacherId?: string | null;
  reference?: string | null;
  message?: string | null;
};

const SUCCESS_REDIRECT = '/account?view=my-courses';
const COUNTDOWN_SECONDS = 4;

function localizeGatewayMessage(raw: string | null | undefined, isRtl: boolean): string | null {
  if (!raw?.trim()) return null;
  const msg = raw.trim();
  const map: Record<string, string> = {
    'Invoice payment completed successfully.': 'پرداخت فاکتور با موفقیت انجام شد.',
    'Payment was already confirmed.': 'پرداخت قبلاً تأیید شده بود.',
    'Invoice payment was already completed.': 'پرداخت فاکتور قبلاً تکمیل شده بود.',
    'The transaction was recorded successfully.': 'تراکنش شما با موفقیت ثبت شد.',
    'Invoice not found.': 'فاکتور یافت نشد.',
    'The paid amount does not match the invoice amount.': 'مبلغ پرداخت‌شده با مبلغ فاکتور مطابقت ندارد.',
  };
  if (isRtl && map[msg]) return map[msg];
  return msg;
}

export function PaymentResultClient({
  status,
  type,
  invoiceId,
  seminarId,
  teacherId,
  reference,
  message,
}: Props) {
  const router = useRouter();
  const { locale } = useLanguage();
  const isRtl = locale === 'fa';
  const isSuccess = status?.toLowerCase() === 'success';
  const isInvoice = type?.toLowerCase() === 'invoice';
  const isAdSubscription = type?.toLowerCase() === 'adsubscription';
  const isAdContactUnlock = type?.toLowerCase() === 'adcontactunlock';
  const isAdOneTimeBump = type?.toLowerCase() === 'adonetimbump';
  const isAdAutoBumpPackage = type?.toLowerCase() === 'adautobumppackage';
  const isSupportSubscription = type?.toLowerCase() === 'supportsubscription';
  const isSeminar = type?.toLowerCase() === 'seminar';

  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);

  const title = isSuccess
    ? (isRtl ? 'پرداخت با موفقیت انجام شد' : 'Payment Successful')
    : (isRtl ? 'پرداخت ناموفق بود' : 'Payment Failed');

  const subtitle = isSuccess
    ? (isRtl
        ? 'ثبت‌نام شما انجام شد. می‌توانید به داشبورد یا دوره‌های خود بروید.'
        : 'Your enrollment is ready. Go to your dashboard or courses.')
    : (isRtl ? 'پرداخت شما نهایی نشد.' : 'The payment could not be completed.');

  const displayMessage =
    localizeGatewayMessage(message, isRtl) ??
    (isSuccess
      ? (isRtl
          ? 'تراکنش شما با موفقیت ثبت شد و دوره به حساب شما اضافه می‌شود.'
          : 'The transaction was recorded successfully and your course will appear in My Courses.')
      : (isRtl ? 'لطفاً دوباره تلاش کنید.' : 'Please try again later.'));

  const dashboardHref = useMemo(() => {
    if (!isSuccess) {
      if (isInvoice && invoiceId) return `/invoices/${invoiceId}`;
      if (seminarId) return `/seminars/${seminarId}`;
      if (isSupportSubscription) return '/account?view=support-chats';
      if (isAdSubscription || isAdOneTimeBump || isAdAutoBumpPackage) return '/professor/advertisement-plans';
      return '/';
    }

    if (isSupportSubscription) return '/account?view=support-chats';
    if (isAdSubscription || isAdOneTimeBump || isAdAutoBumpPackage) return '/professor/advertisement-plans';
    if (isAdContactUnlock && teacherId) return `/advertisements/${teacherId}`;
    if (isSeminar) return '/account/seminars';
    // Course purchase / invoice / default student flow
    return SUCCESS_REDIRECT;
  }, [
    isSuccess,
    isInvoice,
    invoiceId,
    seminarId,
    isSupportSubscription,
    isAdSubscription,
    isAdOneTimeBump,
    isAdAutoBumpPackage,
    isAdContactUnlock,
    teacherId,
    isSeminar,
  ]);

  const shouldAutoRedirect =
    isSuccess &&
    !isSupportSubscription &&
    !isAdSubscription &&
    !isAdOneTimeBump &&
    !isAdAutoBumpPackage &&
    !isAdContactUnlock &&
    !isSeminar;

  useEffect(() => {
    if (!shouldAutoRedirect) return;

    setSecondsLeft(COUNTDOWN_SECONDS);
    const tick = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(tick);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(tick);
  }, [shouldAutoRedirect]);

  useEffect(() => {
    if (!shouldAutoRedirect || secondsLeft > 0) return;
    router.replace(SUCCESS_REDIRECT);
  }, [shouldAutoRedirect, secondsLeft, router]);

  return (
    <Card className="mx-auto max-w-2xl overflow-hidden border-border/60 shadow-lg">
      <CardHeader className="text-center">
        <div
          className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
            isSuccess ? 'bg-emerald-500/15' : 'bg-destructive/10'
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          ) : (
            <CircleX className="h-8 w-8 text-destructive" />
          )}
        </div>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription className="text-base">{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-center text-sm text-muted-foreground">{displayMessage}</p>

        {reference ? (
          <div className="rounded-lg border bg-muted/30 p-4 text-sm">
            <p className="font-medium">{isRtl ? 'شماره پیگیری' : 'Reference number'}</p>
            <p className="mt-1 break-all font-mono" dir="ltr">
              {reference}
            </p>
          </div>
        ) : null}

        {shouldAutoRedirect ? (
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-center text-sm">
            {isRtl
              ? `هدایت خودکار به داشبورد دوره‌ها تا ${secondsLeft} ثانیه دیگر…`
              : `Redirecting to your courses dashboard in ${secondsLeft}s…`}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          {isSuccess && shouldAutoRedirect ? (
            <>
              <Button asChild className="flex-1" size="lg">
                <Link href={SUCCESS_REDIRECT}>
                  <LayoutDashboard className="me-2 h-4 w-4" />
                  {isRtl ? 'داشبورد و دوره‌های من' : 'Dashboard & my courses'}
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1" size="lg">
                <Link href="/courses">
                  <BookOpen className="me-2 h-4 w-4" />
                  {isRtl ? 'لیست دوره‌ها' : 'Browse courses'}
                </Link>
              </Button>
            </>
          ) : (
            <Button asChild className="flex-1" size="lg">
              <Link href={dashboardHref}>
                <GraduationCap className="me-2 h-4 w-4" />
                {isSuccess
                  ? isRtl
                    ? 'ادامه'
                    : 'Continue'
                  : isRtl
                    ? 'بازگشت'
                    : 'Go back'}
              </Link>
            </Button>
          )}
          <Button asChild variant="ghost" className="flex-1" size="lg">
            <Link href="/">{isRtl ? 'صفحه اصلی' : 'Home page'}</Link>
          </Button>
        </div>

        {isSuccess && isInvoice && invoiceId ? (
          <p className="text-center text-xs text-muted-foreground">
            <Link href={`/invoices/${invoiceId}`} className="underline-offset-2 hover:underline">
              {isRtl ? 'مشاهده جزئیات فاکتور' : 'View invoice details'}
            </Link>
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
