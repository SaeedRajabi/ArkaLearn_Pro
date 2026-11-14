'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { confirmNewsletterSubscribe, sendNewsletterSubscribeOtp } from '@/lib/api/newsletter';
import { getApiErrorMessage, getUserFacingApiErrorMessage } from '@/lib/api/client';

type Dict = Record<string, string>;

interface ArticlesNewsletterProps {
  dict: Dict;
  lang: 'en' | 'fa';
}

function resolveNewsletterError(error: unknown, dict: Dict, isRtl: boolean): string {
  const raw = getApiErrorMessage(error, '').toLowerCase();
  if (raw.includes('already subscribed')) {
    return (
      dict.newsletterAlreadySubscribed ??
      (isRtl ? 'این ایمیل قبلاً در خبرنامه عضو شده است.' : 'This email is already subscribed.')
    );
  }
  if (raw.includes('please wait before requesting')) {
    return (
      dict.newsletterResendCooldown ??
      (isRtl ? 'لطفاً قبل از درخواست کد جدید کمی صبر کنید.' : 'Please wait before requesting a new code.')
    );
  }
  if (raw.includes('invalid or expired')) {
    return (
      dict.newsletterInvalidOtp ??
      (isRtl ? 'کد تأیید نامعتبر یا منقضی شده است.' : 'The verification code is invalid or has expired.')
    );
  }
  if (raw.includes('invalid email')) {
    return (
      dict.newsletterInvalidDesc ??
      (isRtl ? 'لطفاً یک ایمیل معتبر وارد کنید.' : 'Please enter a valid email address.')
    );
  }
  return getUserFacingApiErrorMessage(
    error,
    dict.newsletterGenericError ??
      (isRtl ? 'خطایی رخ داد. لطفاً دوباره تلاش کنید.' : 'Something went wrong. Please try again.')
  );
}

export function ArticlesNewsletter({ dict, lang }: ArticlesNewsletterProps) {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [cooldown, setCooldown] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const isRtl = lang === 'fa';
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      toast({
        title: dict.newsletterInvalid ?? (isRtl ? 'ایمیل نامعتبر' : 'Invalid email'),
        description:
          dict.newsletterInvalidDesc ??
          (isRtl ? 'لطفاً یک ایمیل معتبر وارد کنید.' : 'Please enter a valid email address.'),
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const session = await sendNewsletterSubscribeOtp(value);
      setSessionId(session.sessionId);
      setCooldown(session.resendCooldownSeconds);
      setStep('otp');
      toast({
        title: dict.newsletterOtpSent ?? (isRtl ? 'کد ارسال شد' : 'Code sent'),
        description:
          dict.newsletterOtpSentDesc ??
          (isRtl
            ? 'کد تأیید به ایمیل شما ارسال شد.'
            : 'A verification code was sent to your email.'),
      });
    } catch (err) {
      toast({
        title: dict.newsletterFailed ?? (isRtl ? 'عضویت ناموفق' : 'Subscription failed'),
        description: resolveNewsletterError(err, dict, isRtl),
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.trim().length < 4) {
      toast({
        title: dict.newsletterFailed ?? (isRtl ? 'عضویت ناموفق' : 'Subscription failed'),
        description:
          dict.newsletterInvalidOtp ??
          (isRtl ? 'کد تأیید نامعتبر یا منقضی شده است.' : 'The verification code is invalid or has expired.'),
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      await confirmNewsletterSubscribe({
        email: email.trim(),
        otpSessionId: sessionId,
        otpCode: otpCode.trim(),
      });
      toast({
        title: dict.newsletterSuccess ?? (isRtl ? 'ثبت شد' : 'Subscribed'),
        description:
          dict.newsletterSuccessDesc ??
          (isRtl
            ? 'عضویت شما در خبرنامه تأیید شد.'
            : 'Your newsletter subscription is confirmed.'),
      });
      setEmail('');
      setOtpCode('');
      setSessionId('');
      setStep('email');
    } catch (err) {
      toast({
        title: dict.newsletterFailed ?? (isRtl ? 'عضویت ناموفق' : 'Subscription failed'),
        description: resolveNewsletterError(err, dict, isRtl),
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || submitting) return;
    setSubmitting(true);
    try {
      const session = await sendNewsletterSubscribeOtp(email.trim());
      setSessionId(session.sessionId);
      setCooldown(session.resendCooldownSeconds);
      toast({
        title: dict.newsletterOtpSent ?? (isRtl ? 'کد ارسال شد' : 'Code sent'),
        description:
          dict.newsletterOtpSentDesc ??
          (isRtl
            ? 'کد تأیید به ایمیل شما ارسال شد.'
            : 'A verification code was sent to your email.'),
      });
    } catch (err) {
      toast({
        title: dict.newsletterFailed ?? (isRtl ? 'عضویت ناموفق' : 'Subscription failed'),
        description: resolveNewsletterError(err, dict, isRtl),
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      className={cn(
        'overflow-hidden rounded-3xl border border-slate-800/40',
        'bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800',
        'px-5 py-8 sm:px-8 sm:py-10 lg:px-10'
      )}
    >
      <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
        <div className="space-y-4 text-white">
          <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-amber-300">
            {dict.newsletterBadge ?? (isRtl ? 'خبرنامه هفتگی آکادمی' : 'Weekly academy newsletter')}
          </span>
          <h2 className="text-2xl font-extrabold leading-9 sm:text-3xl">
            {dict.newsletterTitle ??
              (isRtl ? 'هر هفته یک قدم جلوتر از بقیه باش' : 'Stay one step ahead every week')}
          </h2>
          <p className="max-w-xl text-sm leading-7 text-slate-300">
            {dict.newsletterDescription ??
              (isRtl
                ? 'خلاصه بهترین مقالات، نکات کاربردی و مسیرهای یادگیری را هر هفته در ایمیل خود دریافت کنید.'
                : 'Get a weekly digest of the best articles, practical tips, and learning paths.')}
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-slate-300">
            <span className="rounded-full bg-white/10 px-3 py-1">
              {dict.newsletterChipMembers ?? (isRtl ? '+۳۰۰۰ عضو فعال' : '+3000 active members')}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1">
              {dict.newsletterChipWeekly ?? (isRtl ? 'ارسال هفتگی' : 'Weekly delivery')}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1">
              {dict.newsletterChipCancel ?? (isRtl ? 'لغو عضویت در هر زمان' : 'Unsubscribe anytime')}
            </span>
          </div>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="space-y-3 rounded-2xl bg-white/5 p-4 backdrop-blur-sm sm:p-5">
            <label className="block text-sm font-medium text-slate-200">
              {dict.newsletterEmailLabel ?? (isRtl ? 'ایمیل خود را وارد کنید' : 'Enter your email')}
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={dict.newsletterEmailPlaceholder ?? 'example@mail.com'}
              className="h-11 rounded-xl border-white/10 bg-white text-slate-900 placeholder:text-slate-400"
              disabled={submitting}
              autoComplete="email"
            />
            <Button
              type="submit"
              disabled={submitting}
              className="h-11 w-full rounded-xl bg-[hsl(var(--accent))] text-slate-950 hover:bg-[hsl(var(--accent))]/90"
            >
              {submitting
                ? dict.newsletterSubmitting ?? (isRtl ? 'در حال ثبت...' : 'Submitting...')
                : dict.newsletterSubmit ?? (isRtl ? 'عضویت در خبرنامه' : 'Subscribe')}
              {!submitting ? <Arrow className="ms-2 h-4 w-4" /> : null}
            </Button>
            <p className="text-[11px] leading-5 text-slate-400">
              {dict.newsletterPrivacy ??
                (isRtl
                  ? 'ایمیل شما فقط برای ارسال خبرنامه استفاده می‌شود.'
                  : 'Your email is only used for the newsletter.')}
            </p>
          </form>
        ) : (
          <form onSubmit={handleConfirm} className="space-y-3 rounded-2xl bg-white/5 p-4 backdrop-blur-sm sm:p-5">
            <label className="block text-sm font-medium text-slate-200">
              {dict.newsletterOtpLabel ??
                (isRtl ? 'کد تأیید ارسال‌شده به ایمیل' : 'Verification code sent to your email')}
            </label>
            <p className="text-xs text-slate-400" dir="ltr">
              {email}
            </p>
            <Input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
              placeholder={dict.newsletterOtpPlaceholder ?? (isRtl ? 'کد ۶ رقمی' : '6-digit code')}
              className="h-11 rounded-xl border-white/10 bg-white text-slate-900 placeholder:text-slate-400 tracking-widest"
              disabled={submitting}
            />
            <Button
              type="submit"
              disabled={submitting}
              className="h-11 w-full rounded-xl bg-[hsl(var(--accent))] text-slate-950 hover:bg-[hsl(var(--accent))]/90"
            >
              {submitting
                ? dict.newsletterConfirming ?? (isRtl ? 'در حال تأیید...' : 'Confirming...')
                : dict.newsletterConfirm ?? (isRtl ? 'تأیید عضویت' : 'Confirm subscription')}
            </Button>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
              <button
                type="button"
                className="underline-offset-2 hover:underline disabled:opacity-50"
                disabled={submitting}
                onClick={() => {
                  setStep('email');
                  setOtpCode('');
                  setSessionId('');
                }}
              >
                {dict.newsletterChangeEmail ?? (isRtl ? 'تغییر ایمیل' : 'Change email')}
              </button>
              <button
                type="button"
                className="underline-offset-2 hover:underline disabled:opacity-50"
                disabled={submitting || cooldown > 0}
                onClick={handleResend}
              >
                {cooldown > 0
                  ? (dict.newsletterResendIn ?? (isRtl ? 'ارسال مجدد تا' : 'Resend in')) +
                    ` ${cooldown}s`
                  : dict.newsletterResend ?? (isRtl ? 'ارسال مجدد کد' : 'Resend code')}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
