'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BrandLogo } from '@/components/brand-logo';
import { ArrowLeft, Loader2, Mail, Smartphone } from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { isAdminDashboardRole } from '@/lib/auth/dashboard-access';
import { isForceRelogin, isLogoutPending } from '@/lib/auth/logout-client';
import { resetLoginRedirectGuard } from '@/lib/auth/session-expired';
import { LoginPuzzleCaptcha } from '@/components/auth/login-puzzle-captcha';
import * as authApi from '@/lib/auth/api';

type Step = 'credentials' | 'captcha' | 'twoFactor';

export function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const { login, confirmTwoFactor, authUser, loading, initialized, sessionVerified } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const { t } = useLanguage();
  const { toast } = useToast();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [step, setStep] = React.useState<Step>('credentials');

  const [captchaId, setCaptchaId] = React.useState('');
  const [targetPercent, setTargetPercent] = React.useState(50);
  const [tolerancePercent, setTolerancePercent] = React.useState(4);
  const [captchaSlidePercent, setCaptchaSlidePercent] = React.useState<number | null>(null);

  const [twoFactorSessionId, setTwoFactorSessionId] = React.useState('');
  const [otpCode, setOtpCode] = React.useState('');
  const [channel, setChannel] = React.useState('sms');
  const [maskedDestination, setMaskedDestination] = React.useState('');
  const [resendCooldown, setResendCooldown] = React.useState(0);

  React.useEffect(() => {
    resetLoginRedirectGuard();
  }, []);

  React.useEffect(() => {
    if (isLogoutPending()) return;
    if (isForceRelogin()) return;
    if (!loading && sessionVerified && authUser && isAdminDashboardRole(authUser.roleName)) {
      router.replace(redirect);
    }
  }, [loading, sessionVerified, authUser, redirect, router]);

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const applyCaptchaChallenge = (challenge: {
    captchaId: string;
    targetPercent: number;
    tolerancePercent: number;
  }) => {
    setCaptchaId(challenge.captchaId);
    setTargetPercent(challenge.targetPercent);
    setTolerancePercent(challenge.tolerancePercent);
    setCaptchaSlidePercent(null);
    setStep('captcha');
  };

  const applyTwoFactorChallenge = (challenge: {
    twoFactorSessionId: string;
    channel: string;
    maskedDestination: string;
    resendCooldownSeconds: number;
  }) => {
    setTwoFactorSessionId(challenge.twoFactorSessionId);
    setChannel(challenge.channel);
    setMaskedDestination(challenge.maskedDestination);
    setResendCooldown(challenge.resendCooldownSeconds);
    setOtpCode('');
    setStep('twoFactor');
  };

  const handleLogin = async (opts?: { captchaId?: string; captchaSlidePercent?: number }) => {
    setIsLoading(true);
    try {
      const result = await login(
        {
          userNameOrEmail: email,
          password,
          captchaId: opts?.captchaId,
          captchaSlidePercent: opts?.captchaSlidePercent,
        },
        redirect
      );

      if (result.kind === 'captcha') {
        if (result.loginFailed) {
          toast({
            variant: 'destructive',
            title: t('login_failed_title'),
            description: result.message || t('login_failed_description'),
          });
        }
        applyCaptchaChallenge(result);
        return;
      }

      if (result.kind === 'twoFactor') {
        applyTwoFactorChallenge(result);
        toast({
          title: t('login_2fa_code_sent_title'),
          description: t('login_2fa_code_sent_description').replace(
            '{destination}',
            result.maskedDestination || '—'
          ),
        });
        return;
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : '';
      const isAdminOnly = msg === 'DASHBOARD_ADMIN_ONLY' || msg === 'DASHBOARD_STAFF_ONLY';
      toast({
        variant: 'destructive',
        title: isAdminOnly ? t('login_dashboard_admin_only_title') : t('login_failed_title'),
        description: isAdminOnly
          ? t('login_dashboard_admin_only_description')
          : t('login_failed_description'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCaptchaVerified = (slidePercent: number) => {
    setCaptchaSlidePercent(slidePercent);
    void handleLogin({ captchaId, captchaSlidePercent: slidePercent });
  };

  const handleRefreshCaptcha = async () => {
    try {
      const challenge = await authApi.fetchLoginCaptchaChallenge();
      applyCaptchaChallenge(challenge);
    } catch {
      toast({
        variant: 'destructive',
        title: t('login_captcha_refresh_failed'),
      });
    }
  };

  const handleConfirmOtp = async () => {
    setIsLoading(true);
    try {
      await confirmTwoFactor({ twoFactorSessionId, otpCode: otpCode.trim() }, redirect);
    } catch {
      toast({
        variant: 'destructive',
        title: t('login_2fa_failed_title'),
        description: t('login_2fa_failed_description'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || !twoFactorSessionId) return;
    setIsLoading(true);
    try {
      const result = await authApi.resendLoginTwoFactor(twoFactorSessionId);
      if (result.kind === 'twoFactor') {
        applyTwoFactorChallenge(result);
        toast({
          title: t('login_2fa_code_sent_title'),
          description: t('login_2fa_code_sent_description').replace(
            '{destination}',
            result.maskedDestination || '—'
          ),
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: t('login_2fa_resend_failed'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const showSessionBootstrapLoader = !initialized || (loading && !sessionVerified && !isLoading);

  if (showSessionBootstrapLoader) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-background"
        suppressHydrationWarning
      >
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-muted-foreground">{t('login_logging_in')}</span>
        </div>
      </div>
    );
  }

  if (
    !isLogoutPending() &&
    !isForceRelogin() &&
    sessionVerified &&
    authUser &&
    isAdminDashboardRole(authUser.roleName)
  ) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <BrandLogo showWordmark={false} />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight xs:text-3xl">
            {step === 'twoFactor'
              ? t('login_2fa_title')
              : step === 'captcha'
                ? t('login_captcha_title')
                : t('login_title')}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {step === 'twoFactor'
              ? t('login_2fa_description')
              : step === 'captcha'
                ? t('login_captcha_description')
                : t('login_description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'twoFactor' ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleConfirmOtp();
              }}
              className="space-y-5"
            >
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-3 py-3 text-sm">
                {channel === 'email' ? (
                  <Mail className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                ) : (
                  <Smartphone className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                )}
                <div className="min-w-0 text-start">
                  <p className="font-medium">
                    {channel === 'email' ? t('login_2fa_via_email') : t('login_2fa_via_sms')}
                  </p>
                  <p className="truncate text-muted-foreground" dir="ltr">
                    {maskedDestination || '—'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp">{t('login_2fa_code_label')}</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="••••••"
                  className="text-center text-lg tracking-[0.35em]"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={isLoading}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full text-base xs:text-lg"
                disabled={isLoading || otpCode.trim().length < 4}
              >
                {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {t('login_2fa_verify_button')}
              </Button>

              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-1 px-0"
                  onClick={() => {
                    setStep('credentials');
                    setOtpCode('');
                    setCaptchaSlidePercent(null);
                  }}
                  disabled={isLoading}
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t('login_2fa_back')}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto px-0"
                  disabled={isLoading || resendCooldown > 0}
                  onClick={() => void handleResendOtp()}
                >
                  {resendCooldown > 0
                    ? t('login_2fa_resend_in').replace('{seconds}', String(resendCooldown))
                    : t('login_2fa_resend')}
                </Button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (step === 'captcha') {
                  if (captchaSlidePercent == null) {
                    toast({
                      variant: 'destructive',
                      title: t('login_captcha_required_title'),
                      description: t('login_captcha_required_description'),
                    });
                    return;
                  }
                  void handleLogin({ captchaId, captchaSlidePercent });
                  return;
                }
                void handleLogin();
              }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <Label htmlFor="email">{t('login_email_label')}</Label>
                <Input
                  id="email"
                  type="text"
                  autoComplete="username"
                  placeholder={t('login_email_placeholder')}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('login_password_label')}</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {step === 'captcha' ? (
                <LoginPuzzleCaptcha
                  targetPercent={targetPercent}
                  tolerancePercent={tolerancePercent}
                  disabled={isLoading}
                  title={t('login_captcha_puzzle_title')}
                  hint={t('login_captcha_puzzle_hint')}
                  verifyLabel={t('login_captcha_verify')}
                  refreshLabel={t('login_captcha_refresh')}
                  onRefresh={() => void handleRefreshCaptcha()}
                  onVerified={handleCaptchaVerified}
                />
              ) : null}

              <Button type="submit" className="w-full text-base xs:text-lg" disabled={isLoading}>
                {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {isLoading ? t('login_logging_in') : t('login_button')}
              </Button>
            </form>
          )}
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link href="https://arkasoftware.ir" className="text-primary hover:underline">
              {t('back_to_site')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
