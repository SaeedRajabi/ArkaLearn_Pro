'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Phone, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getDictValue, formatDictTemplate } from '@/lib/i18n-client';
import type { Dictionary } from '@/types';
import {
  confirmProfilePhoneVerification,
  sendProfilePhoneVerificationOtp,
} from '@/lib/api/sms';
import { resolveUserFacingError } from '@/lib/errors/user-facing-message';
import { useAuth } from '@/contexts/auth-context';
import type { CurrentUser } from '@/lib/api/account';

export function PhoneVerifyForm({ dict, user }: { dict: Dictionary; user: CurrentUser | null }) {
  const { refetch } = useAuth();
  const { toast } = useToast();
  const t = (key: string, fallback: string) => getDictValue(dict, key, fallback);

  const [otpCode, setOtpCode] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [step, setStep] = useState<'idle' | 'otp'>('idle');
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);

  const verified = Boolean(user?.phoneNumberVerified);
  const phone = user?.phoneNumber?.trim() ?? '';

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleSendOtp() {
    setLoading(true);
    try {
      const session = await sendProfilePhoneVerificationOtp();
      setSessionId(session.sessionId);
      setCooldown(session.resendCooldownSeconds);
      setStep('otp');
      toast({ title: t('dashboard.phone.codeSent', 'Verification code sent to your phone') });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('dashboard.phone.sendFailed', 'Could not send code'),
        description: resolveUserFacingError(
          err,
          t('dashboard.phone.sendFailed', 'Could not send verification code')
        ),
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (otpCode.trim().length < 4) {
      toast({
        variant: 'destructive',
        title: t('dashboard.phone.verifyFailed', 'Verification failed'),
        description: t('dashboard.phone.errorInvalidOtp', 'The verification code is invalid or has expired.'),
      });
      return;
    }

    setLoading(true);
    try {
      await confirmProfilePhoneVerification({
        otpSessionId: sessionId,
        otpCode: otpCode.trim(),
      });
      await refetch();
      toast({
        variant: 'success',
        title: t('dashboard.phone.verifiedSuccess', 'Phone verified successfully'),
      });
      setStep('idle');
      setOtpCode('');
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('dashboard.phone.verifyFailed', 'Verification failed'),
        description: resolveUserFacingError(
          err,
          t('dashboard.phone.errorInvalidOtp', 'The verification code is invalid or has expired.')
        ),
      });
    } finally {
      setLoading(false);
    }
  }

  if (!phone) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          {t('dashboard.phone.verifyTitle', 'Phone verification')}
        </CardTitle>
        <CardDescription>
          {verified
            ? t('dashboard.phone.verifiedDescription', 'Your phone number is verified.')
            : t(
                'dashboard.phone.unverifiedDescription',
                'Verify your current phone number with an SMS code. You do not need to enter a new number.'
              )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">{t('dashboard.phone.status', 'Status')}:</span>
          {verified ? (
            <span className="inline-flex items-center gap-1 font-medium text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              {t('dashboard.phone.verified', 'Verified')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-medium text-destructive">
              <XCircle className="h-4 w-4" />
              {t('dashboard.phone.notVerified', 'Not verified')}
            </span>
          )}
        </div>

        <p className="text-sm" dir="ltr">
          <span className="text-muted-foreground">{t('dashboard.phone.currentLabel', 'Current number')}: </span>
          <span className="font-medium">{phone}</span>
        </p>

        {!verified ? (
          <>
            {step === 'idle' ? (
              <Button type="button" disabled={loading} onClick={() => void handleSendOtp()}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t('dashboard.phone.sendCode', 'Send verification code')}
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.phone.otpHint', 'Enter the code sent to {phone}').replace('{phone}', phone)}
                </p>
                <div className="space-y-2">
                  <Label htmlFor="phone-verify-otp">{t('dashboard.phone.enterCode', 'Enter verification code')}</Label>
                  <Input
                    id="phone-verify-otp"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    inputMode="numeric"
                    maxLength={6}
                    dir="ltr"
                    className="tracking-widest"
                    placeholder={t('dashboard.phone.otpLabel', 'Verification code')}
                    aria-invalid={otpCode.length > 0 && otpCode.length < 4}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    disabled={loading || otpCode.trim().length < 4}
                    onClick={() => void handleConfirm()}
                  >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {t('dashboard.phone.confirmVerify', 'Confirm phone')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading || cooldown > 0}
                    onClick={() => void handleSendOtp()}
                  >
                    {cooldown > 0
                      ? formatDictTemplate(t('dashboard.phone.resendIn', 'Resend in {seconds}s'), {
                          seconds: String(cooldown),
                        })
                      : t('dashboard.phone.resend', 'Resend code')}
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
