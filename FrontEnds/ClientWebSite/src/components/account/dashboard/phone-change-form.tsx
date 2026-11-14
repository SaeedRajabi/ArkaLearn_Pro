'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getDictValue } from '@/lib/i18n-client';
import type { Dictionary } from '@/types';
import { confirmPhoneChange, sendPhoneChangeOtp } from '@/lib/api/sms';
import { resolveUserFacingError } from '@/lib/errors/user-facing-message';
import { useAuth } from '@/contexts/auth-context';

export function PhoneChangeForm({ dict }: { dict: Dictionary }) {
  const { refetch } = useAuth();
  const { toast } = useToast();
  const t = (key: string, fallback: string) => getDictValue(dict, key, fallback);

  const [newPhone, setNewPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleSendOtp() {
    setLoading(true);
    try {
      const session = await sendPhoneChangeOtp(newPhone.trim());
      setSessionId(session.sessionId);
      setCooldown(session.resendCooldownSeconds);
      setStep('otp');
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('dashboard.phone.changeFailed', 'شماره تماس ثبت نشد'),
        description: resolveUserFacingError(
          err,
          t(
            'dashboard.phone.alreadyUsed',
            'شماره تماس ثبت نشد و اعتبارسنجی نشد؛ این شماره قبلاً استفاده شده است.'
          )
        ),
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    setLoading(true);
    try {
      await confirmPhoneChange({
        newPhoneNumber: newPhone.trim(),
        otpSessionId: sessionId,
        otpCode: otpCode.trim(),
      });
      await refetch();
      toast({
        variant: 'success',
        title: t('dashboard.phone.updated', 'شماره تماس به‌روزرسانی شد'),
      });
      setStep('phone');
      setOtpCode('');
      setNewPhone('');
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('dashboard.phone.changeFailed', 'شماره تماس ثبت نشد'),
        description: resolveUserFacingError(
          err,
          t(
            'dashboard.phone.alreadyUsed',
            'شماره تماس ثبت نشد و اعتبارسنجی نشد؛ این شماره قبلاً استفاده شده است.'
          )
        ),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.phone.title', 'Contact number')}</CardTitle>
        <CardDescription>{t('dashboard.phone.description', 'Update your mobile number. A verification code will be sent by SMS.')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 'phone' ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="newPhone">{t('dashboard.phone.newLabel', 'New mobile number')}</Label>
              <Input id="newPhone" type="tel" dir="ltr" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="09182767745" />
            </div>
            <Button type="button" disabled={loading || !newPhone.trim()} onClick={() => void handleSendOtp()}>
              {t('dashboard.phone.sendCode', 'Send verification code')}
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {t('dashboard.phone.otpHint', 'Enter the code sent to {phone}').replace('{phone}', newPhone)}
            </p>
            <div className="space-y-2">
              <Label htmlFor="otp">{t('dashboard.phone.otpLabel', 'Verification code')}</Label>
              <Input id="otp" inputMode="numeric" maxLength={6} dir="ltr" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled={loading} onClick={() => void handleConfirm()}>
                {t('dashboard.phone.confirm', 'Confirm new number')}
              </Button>
              <Button type="button" variant="outline" disabled={loading || cooldown > 0} onClick={() => void handleSendOtp()}>
                {cooldown > 0
                  ? t('dashboard.phone.resendWait', 'Resend in {s}s').replace('{s}', String(cooldown))
                  : t('dashboard.phone.resend', 'Resend code')}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setStep('phone')}>
                {t('dashboard.phone.changeNumber', 'Change number')}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
