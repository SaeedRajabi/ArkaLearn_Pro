'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Mail, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getDictValue, formatDictTemplate } from '@/lib/i18n-client';
import type { Dictionary } from '@/types';
import { confirmProfileEmailVerification, sendProfileEmailVerificationOtp } from '@/lib/api/email-verification';
import { resolveEmailApiErrorMessage } from '@/lib/auth/email-api-errors';
import { useAuth } from '@/contexts/auth-context';
import type { CurrentUser } from '@/lib/api/account';
import { cn } from '@/lib/utils';

export function EmailVerifyForm({ dict, user }: { dict: Dictionary; user: CurrentUser | null }) {
  const { refetch } = useAuth();
  const { toast } = useToast();
  const t = (key: string, fallback: string) => getDictValue(dict, key, fallback);

  const [otpCode, setOtpCode] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [step, setStep] = useState<'idle' | 'otp'>('idle');
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);

  const verified = Boolean(user?.emailVerified);
  const email = user?.email?.trim() ?? '';

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleSendOtp() {
    setLoading(true);
    try {
      const session = await sendProfileEmailVerificationOtp();
      setSessionId(session.sessionId);
      setCooldown(session.resendCooldownSeconds);
      setStep('otp');
      toast({ title: t('dashboard.email.codeSent', 'Verification code sent to your email') });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('dashboard.email.sendFailed', 'Could not send code'),
        description: resolveEmailApiErrorMessage(err, dict, 'dashboard.email.sendFailed', 'Could not send code'),
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (otpCode.trim().length < 4) {
      toast({
        variant: 'destructive',
        title: t('dashboard.email.verifyFailed', 'Verification failed'),
        description: t('dashboard.email.errorInvalidOtp', 'The verification code is invalid or has expired.'),
      });
      return;
    }

    setLoading(true);
    try {
      await confirmProfileEmailVerification({
        otpSessionId: sessionId,
        otpCode: otpCode.trim(),
      });
      await refetch();
      toast({ title: t('dashboard.email.verifiedSuccess', 'Email verified successfully') });
      setStep('idle');
      setOtpCode('');
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('dashboard.email.verifyFailed', 'Verification failed'),
        description: resolveEmailApiErrorMessage(err, dict, 'dashboard.email.verifyFailed', 'Verification failed'),
      });
    } finally {
      setLoading(false);
    }
  }

  if (!email) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          {t('dashboard.email.title', 'Email verification')}
        </CardTitle>
        <CardDescription>
          {verified
            ? t('dashboard.email.verifiedDescription', 'Your email is verified. You can use all site features.')
            : t(
                'dashboard.email.unverifiedDescription',
                'Verify your current email with a code. You do not need to enter a new email address.'
              )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">{t('dashboard.email.status', 'Status')}:</span>
          {verified ? (
            <span className="inline-flex items-center gap-1 font-medium text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              {t('dashboard.email.verified', 'Verified')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-medium text-destructive">
              <XCircle className="h-4 w-4" />
              {t('dashboard.email.notVerified', 'Not verified')}
            </span>
          )}
        </div>

        <p className="text-sm" dir="ltr">
          <span className="text-muted-foreground">{t('dashboard.email.currentLabel', 'Current email')}: </span>
          <span className="font-medium">{email}</span>
        </p>

        {!verified ? (
          <>
            {step === 'idle' ? (
              <Button type="button" disabled={loading} onClick={() => void handleSendOtp()}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t('dashboard.email.sendCode', 'Send verification code')}
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="email-otp">{t('dashboard.email.enterCode', 'Enter verification code')}</Label>
                  <Input
                    id="email-otp"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    inputMode="numeric"
                    maxLength={6}
                    dir="ltr"
                    className="tracking-widest"
                    placeholder={t('dashboard.email.otpLabel', 'Verification code')}
                    aria-invalid={otpCode.length > 0 && otpCode.length < 4}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" disabled={loading || otpCode.trim().length < 4} onClick={() => void handleConfirm()}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {t('dashboard.email.confirm', 'Confirm email')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading || cooldown > 0}
                    onClick={() => void handleSendOtp()}
                  >
                    {cooldown > 0
                      ? formatDictTemplate(
                          t('dashboard.email.resendIn', 'Resend in {seconds}s'),
                          { seconds: String(cooldown) }
                        )
                      : t('dashboard.email.resend', 'Resend code')}
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function EmailStatusBadge({ verified }: { verified: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium',
        verified ? 'text-green-600' : 'text-destructive'
      )}
    >
      {verified ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
    </span>
  );
}
