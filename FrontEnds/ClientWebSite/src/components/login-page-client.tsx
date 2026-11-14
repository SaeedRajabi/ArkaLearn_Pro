'use client';

import { useState, useEffect, startTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from 'next/link';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { Logo } from './logo';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { FacebookIcon } from './icons/facebook-icon';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { useAuth } from '@/contexts/auth-context';
import { resolveLoginErrorMessage } from '@/lib/auth/login-error-messages';
import { postAuthNavigate } from '@/lib/auth/post-auth-navigate';
import { resolvePostLoginPath } from '@/lib/auth/roles';
import { isValidLoginIdentifier, normalizeLoginIdentifier } from '@/lib/validation/login';
import { resendLoginTwoFactor } from '@/lib/api/account';

interface LoginPageClientProps {
  dict: Record<string, string>;
}

type TwoFactorChallenge = {
  sessionId: string;
  maskedPhone: string;
  cooldown: number;
};

export function LoginPageClient({ dict }: LoginPageClientProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [registeredMessage, setRegisteredMessage] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [twoFactor, setTwoFactor] = useState<TwoFactorChallenge | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login: doLogin, confirmLoginTwoFactor, setError, error } = useAuth();

  useEffect(() => {
    if (searchParams.get('registered') === '1') {
      setRegisteredMessage(dict.registeredSuccess ?? 'ثبت نام با موفقیت انجام شد. اکنون وارد شوید.');
    }
    if (searchParams.get('blocked') === '1') {
      setError(
        dict.loginAccountBlocked ??
          'سیستم شما را مسدود کرده است. برای رفع مسدودیت لطفاً با پشتیبانی تیم آرکا نرم‌افزار تماس بگیرید.'
      );
    }
  }, [searchParams, dict.registeredSuccess, dict.loginAccountBlocked, setError]);

  useEffect(() => {
    if (!twoFactor || twoFactor.cooldown <= 0) return;
    const timer = setInterval(() => {
      setTwoFactor((prev) => (prev ? { ...prev, cooldown: Math.max(0, prev.cooldown - 1) } : prev));
    }, 1000);
    return () => clearInterval(timer);
  }, [twoFactor?.cooldown, twoFactor]);

  const formSchema = z.object({
    userNameOrEmail: z
      .string()
      .min(1, { message: dict.emailOrUsernameRequired ?? dict.emailRequired })
      .refine((v) => isValidLoginIdentifier(v), {
        message: dict.emailOrUsernameInvalid ?? dict.emailRequired,
      }),
    password: z.string().min(1, {
      message: dict.passwordRequired,
    }),
    rememberMe: z.boolean().default(false).optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userNameOrEmail: '',
      password: '',
      rememberMe: false,
    },
  });

  function finishLogin(role: string | null) {
    const returnUrl = searchParams.get('returnUrl') || searchParams.get('redirect');
    const target = resolvePostLoginPath(role, returnUrl);
    startTransition(() => {
      postAuthNavigate(router, target);
    });
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    setIsRedirecting(true);
    // Prefetch likely destinations in parallel with the login network call.
    try {
      router.prefetch('/account');
      router.prefetch('/professor');
      router.prefetch('/');
    } catch {
      /* ignore */
    }
    try {
      const res = await doLogin({
        userNameOrEmail: normalizeLoginIdentifier(values.userNameOrEmail),
        password: values.password,
      });
      if (res.requiresTwoFactor && res.twoFactorSessionId) {
        setTwoFactor({
          sessionId: res.twoFactorSessionId,
          maskedPhone: res.maskedPhone || '****',
          cooldown: res.resendCooldownSeconds ?? 120,
        });
        setOtpCode('');
        setIsRedirecting(false);
        return;
      }
      const data = res?.userData as Record<string, unknown> | undefined;
      const role =
        data?.Role != null
          ? String(data.Role)
          : data?.role != null
            ? String(data.role)
            : data?.UserRole != null
              ? String(data.UserRole)
              : null;
      finishLogin(role);
    } catch (err) {
      setIsRedirecting(false);
      const msg = resolveLoginErrorMessage(err, dict);
      setError(msg);
    }
  }

  async function onConfirmTwoFactor() {
    if (!twoFactor?.sessionId || otpCode.trim().length < 4) {
      setError(dict.twoFactorOtpRequired ?? 'کد تأیید را وارد کنید.');
      return;
    }
    setError(null);
    setOtpLoading(true);
    setIsRedirecting(true);
    try {
      const res = await confirmLoginTwoFactor({
        twoFactorSessionId: twoFactor.sessionId,
        otpCode: otpCode.trim(),
      });
      const data = res?.userData as Record<string, unknown> | undefined;
      const role =
        data?.Role != null
          ? String(data.Role)
          : data?.role != null
            ? String(data.role)
            : null;
      finishLogin(role);
    } catch (err) {
      setIsRedirecting(false);
      setError(resolveLoginErrorMessage(err, dict));
    } finally {
      setOtpLoading(false);
    }
  }

  async function onResendTwoFactor() {
    if (!twoFactor?.sessionId || twoFactor.cooldown > 0) return;
    setOtpLoading(true);
    try {
      const res = await resendLoginTwoFactor(twoFactor.sessionId);
      setTwoFactor({
        sessionId: res.twoFactorSessionId || twoFactor.sessionId,
        maskedPhone: res.maskedPhone || twoFactor.maskedPhone,
        cooldown: res.resendCooldownSeconds ?? 120,
      });
    } catch (err) {
      setError(resolveLoginErrorMessage(err, dict));
    } finally {
      setOtpLoading(false);
    }
  }

  if (twoFactor) {
    return (
      <>
        <div className="text-center">
          <div className="mb-4 hidden justify-center lg:flex">
            <Logo />
          </div>
          <h1 className="text-3xl font-bold font-headline">
            {dict.twoFactorTitle ?? 'تأیید دو مرحله‌ای'}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {(dict.twoFactorSubtitle ?? 'کد ارسال‌شده به شماره {phone} را وارد کنید.').replace(
              '{phone}',
              twoFactor.maskedPhone
            )}
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="login-otp">
              {dict.twoFactorOtpLabel ?? 'کد تأیید'}
            </label>
            <Input
              id="login-otp"
              inputMode="numeric"
              maxLength={6}
              dir="ltr"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="------"
              className="tracking-[0.3em]"
            />
          </div>
          <Button
            type="button"
            className="w-full"
            loading={otpLoading || isRedirecting}
            loadingText={dict.loadingText}
            disabled={isRedirecting}
            onClick={() => void onConfirmTwoFactor()}
          >
            {dict.twoFactorConfirm ?? 'تأیید و ورود'}
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={otpLoading || twoFactor.cooldown > 0}
              onClick={() => void onResendTwoFactor()}
            >
              {twoFactor.cooldown > 0
                ? (dict.twoFactorResendWait ?? 'ارسال مجدد تا {s} ثانیه').replace(
                    '{s}',
                    String(twoFactor.cooldown)
                  )
                : (dict.twoFactorResend ?? 'ارسال مجدد کد')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setTwoFactor(null);
                setOtpCode('');
                setError(null);
              }}
            >
              {dict.twoFactorBack ?? 'بازگشت به ورود'}
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="text-center">
        <div className="mb-4 hidden justify-center lg:flex">
          <Logo />
        </div>
        <h1 className="text-3xl font-bold font-headline">{dict.title}</h1>
        <p className="mt-2 text-muted-foreground">{dict.subtitle}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
          {registeredMessage && (
            <div className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
              {registeredMessage}
            </div>
          )}
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <FormField
            control={form.control}
            name="userNameOrEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{dict.emailOrUsernameLabel ?? dict.emailLabel}</FormLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground rtl:right-3 rtl:left-auto" />
                  <FormControl>
                    <Input
                      type="text"
                      placeholder={dict.emailOrUsernamePlaceholder ?? 'name@example.com'}
                      className="pl-10 rtl:pr-10"
                      dir="ltr"
                      autoComplete="username email"
                      {...field}
                    />
                  </FormControl>
                </div>
                <p className="text-xs text-muted-foreground">
                  {dict.emailOrUsernameHint ?? 'You can sign in with your email address or username.'}
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{dict.passwordLabel}</FormLabel>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground rtl:right-3 rtl:left-auto" />
                  <FormControl>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10 rtl:pr-10 rtl:pl-10"
                      {...field}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:bg-transparent rtl:left-2 rtl:right-auto"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-wrap items-center justify-between gap-4">
            <FormField
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2 space-y-0 rtl:space-x-reverse">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0 font-normal">{dict.rememberMe}</FormLabel>
                </FormItem>
              )}
            />
            <Link href="/forgot-password" className="text-sm text-primary hover:underline">
              {dict.forgotPassword}
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full"
            loading={form.formState.isSubmitting || isRedirecting}
            loadingText={dict.loadingText}
            disabled={isRedirecting}
          >
            {dict.submitButton}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">{dict.orSeparator}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <GoogleSignInButton label={dict.googleButton} dict={dict} />
            <Button variant="outline" type="button" disabled title={dict.facebookComingSoon ?? 'Coming soon'}>
              <FacebookIcon className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0" />
              {dict.facebookButton}
            </Button>
          </div>
        </form>
      </Form>
      <div className="mt-6 text-center text-sm">
        {dict.noAccountPrompt}{' '}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          {dict.signUpLink}
        </Link>
      </div>
    </>
  );
}

export default LoginPageClient;
