'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getDictValue } from '@/lib/i18n-client';
import type { Dictionary } from '@/types';
import { confirmEmailChange, sendEmailChangeOtp } from '@/lib/api/email-change';
import { resolveEmailApiErrorMessage } from '@/lib/auth/email-api-errors';
import { useAuth } from '@/contexts/auth-context';
import type { CurrentUser } from '@/lib/api/account';

export function EmailChangeForm({ dict, user }: { dict: Dictionary; user: CurrentUser | null }) {
  const { refetch } = useAuth();
  const { toast } = useToast();
  const t = (key: string, fallback: string) => getDictValue(dict, key, fallback);

  const [newEmail, setNewEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleSendOtp() {
    const trimmed = newEmail.trim();
    if (!trimmed || !trimmed.includes('@')) {
      toast({
        variant: 'destructive',
        title: t('dashboard.email.changeFailed', 'Could not send code'),
        description: t('dashboard.email.errorInvalidEmail', 'Enter a valid email address.'),
      });
      return;
    }

    setLoading(true);
    try {
      const session = await sendEmailChangeOtp(trimmed);
      setSessionId(session.sessionId);
      setCooldown(session.resendCooldownSeconds);
      setStep('otp');
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('dashboard.email.changeFailed', 'Could not send code'),
        description: resolveEmailApiErrorMessage(err, dict, 'dashboard.email.changeFailed', 'Could not send code'),
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (otpCode.trim().length < 4) {
      toast({
        variant: 'destructive',
        title: t('dashboard.email.changeFailed', 'Could not update email'),
        description: t('dashboard.email.errorInvalidOtp', 'The verification code is invalid or has expired.'),
      });
      return;
    }

    setLoading(true);
    try {
      await confirmEmailChange({
        newEmail: newEmail.trim(),
        otpSessionId: sessionId,
        otpCode: otpCode.trim(),
      });
      await refetch();
      toast({ title: t('dashboard.email.changed', 'Email updated and verified') });
      setStep('email');
      setOtpCode('');
      setNewEmail('');
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('dashboard.email.changeFailed', 'Could not update email'),
        description: resolveEmailApiErrorMessage(err, dict, 'dashboard.email.changeFailed', 'Could not update email'),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.email.changeTitle', 'Change email address')}</CardTitle>
        <CardDescription>
          {t(
            'dashboard.email.changeDescription',
            'Enter your new email. A verification code will be sent to confirm the change.'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {user?.email ? (
          <p className="text-sm text-muted-foreground">
            {t('dashboard.email.currentLabel', 'Current email')}:{' '}
            <span className="font-medium text-foreground" dir="ltr">
              {user.email}
            </span>
          </p>
        ) : null}

        {step === 'email' ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="newEmail">{t('dashboard.email.newLabel', 'New email address')}</Label>
              <Input
                id="newEmail"
                type="email"
                dir="ltr"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder={t('dashboard.email.newEmailPlaceholder', 'name@example.com')}
              />
            </div>
            <Button type="button" disabled={loading || !newEmail.trim()} onClick={() => void handleSendOtp()}>
              {t('dashboard.email.sendChangeCode', 'Send verification code')}
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {t('dashboard.email.changeOtpHint', 'Enter the code sent to {email}').replace('{email}', newEmail)}
            </p>
            <div className="space-y-2">
              <Label htmlFor="emailChangeOtp">{t('dashboard.email.otpLabel', 'Verification code')}</Label>
              <Input
                id="emailChangeOtp"
                inputMode="numeric"
                maxLength={6}
                dir="ltr"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled={loading || otpCode.length < 4} onClick={() => void handleConfirm()}>
                {t('dashboard.email.confirmChange', 'Confirm new email')}
              </Button>
              <Button type="button" variant="outline" disabled={loading || cooldown > 0} onClick={() => void handleSendOtp()}>
                {cooldown > 0
                  ? t('dashboard.email.resendWait', 'Resend in {s}s').replace('{s}', String(cooldown))
                  : t('dashboard.email.resend', 'Resend code')}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setStep('email')}>
                {t('dashboard.email.changeEmailAgain', 'Change email')}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
