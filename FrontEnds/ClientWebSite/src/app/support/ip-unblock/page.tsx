'use client';

import * as React from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/language-context';
import { sendIpUnblockOtp, submitIpUnblockRequest } from '@/lib/api/security';
import { getUserFacingApiErrorMessage } from '@/lib/api/client';

export default function IpUnblockSupportPage() {
  const { t } = useLanguage();
  const [phone, setPhone] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [sessionId, setSessionId] = React.useState('');
  const [cooldown, setCooldown] = React.useState(0);
  const [sendingOtp, setSendingOtp] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const handleSendOtp = async () => {
    setError('');
    setSendingOtp(true);
    try {
      const session = await sendIpUnblockOtp(phone);
      setSessionId(session.sessionId);
      setCooldown(session.resendCooldownSeconds);
    } catch (err) {
      setError(getUserFacingApiErrorMessage(err, t('ipUnblock.sendOtpFailed')));
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await submitIpUnblockRequest({
        phoneNumber: phone,
        otpSessionId: sessionId,
        otpCode: otp,
        message,
      });
      setDone(true);
    } catch (err) {
      setError(getUserFacingApiErrorMessage(err, t('ipUnblock.submitFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">{t('ipUnblock.successTitle')}</h1>
        <p className="mt-3 text-muted-foreground">{t('ipUnblock.successDescription')}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-10">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">{t('ipUnblock.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('ipUnblock.description')}</p>
      </div>

      <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
        <div className="space-y-2">
          <Label htmlFor="phone">{t('ipUnblock.phoneLabel')}</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09..." />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={sendingOtp || cooldown > 0} onClick={() => void handleSendOtp()}>
            {sendingOtp ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
            {cooldown > 0 ? `${t('ipUnblock.resendWait')} ${cooldown}s` : t('ipUnblock.sendOtp')}
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="otp">{t('ipUnblock.otpLabel')}</Label>
          <Input id="otp" value={otp} onChange={(e) => setOtp(e.target.value)} inputMode="numeric" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">{t('ipUnblock.messageLabel')}</Label>
          <Textarea id="message" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={submitting || !sessionId}>
          {submitting ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
          {t('ipUnblock.submit')}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/ip-blocked" className="underline">
          {t('ipUnblock.backToBlocked')}
        </Link>
      </p>
    </div>
  );
}
