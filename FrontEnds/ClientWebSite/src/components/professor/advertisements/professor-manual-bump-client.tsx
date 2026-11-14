'use client';

import * as React from 'react';
import Link from 'next/link';
import { Loader2, RefreshCw, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getDictValue } from '@/lib/i18n-client';
import {
  getManualBumpCaptcha,
  getMyAdvertisementPlan,
  manualBumpAdvertisement,
  type ManualBumpCaptcha,
  type MyAdvertisementPlan,
} from '@/lib/api/advertisement-monetization';
import type { Dictionary } from '@/types';

function formatCountdown(totalSeconds: number, lang: string) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (lang === 'en') {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toLocaleString('fa-IR')}:${seconds.toString().padStart(2, '0')}`;
}

export function ProfessorManualBumpClient({ dict }: { dict: Dictionary }) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [plan, setPlan] = React.useState<MyAdvertisementPlan | null>(null);
  const [captcha, setCaptcha] = React.useState<ManualBumpCaptcha | null>(null);
  const [captchaInput, setCaptchaInput] = React.useState('');
  const [loadingCaptcha, setLoadingCaptcha] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [secondsLeft, setSecondsLeft] = React.useState(0);
  const lang = String((dict as Record<string, unknown>).lang ?? 'fa');

  const t = (key: string, fallback: string) => getDictValue(dict, key, fallback);

  const loadPlan = React.useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!silent) setLoading(true);
    try {
      const planData = await getMyAdvertisementPlan();
      setPlan(planData);
    } catch {
      if (!silent) {
        toast({ title: t('professorDashboard.manualBump.loadError', 'Failed to load status'), variant: 'destructive' });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [toast, dict]);

  const loadCaptcha = React.useCallback(async () => {
    setLoadingCaptcha(true);
    try {
      const data = await getManualBumpCaptcha();
      setCaptcha(data);
      setCaptchaInput('');
    } catch {
      toast({ title: t('professorDashboard.manualBump.captchaError', 'Could not load captcha'), variant: 'destructive' });
    } finally {
      setLoadingCaptcha(false);
    }
  }, [toast, dict]);

  React.useEffect(() => {
    void loadPlan();
  }, [loadPlan]);

  React.useEffect(() => {
    if (!plan?.nextManualBumpAtUtc || plan.canManualBumpNow) {
      setSecondsLeft(0);
      return;
    }

    const update = () => {
      const diff = Math.max(0, Math.floor((new Date(plan.nextManualBumpAtUtc!).getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
    };

    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [plan?.nextManualBumpAtUtc, plan?.canManualBumpNow]);

  const cooldownRefreshRef = React.useRef(false);

  React.useEffect(() => {
    if (secondsLeft !== 0 || !plan || plan.canManualBumpNow || !plan.nextManualBumpAtUtc) {
      cooldownRefreshRef.current = false;
      return;
    }
    if (cooldownRefreshRef.current) return;
    cooldownRefreshRef.current = true;
    void loadPlan({ silent: true });
  }, [secondsLeft, plan, loadPlan]);

  React.useEffect(() => {
    if (!loading && plan?.canManualBumpNow && !captcha) {
      void loadCaptcha();
    }
  }, [loading, plan?.canManualBumpNow, captcha, loadCaptcha]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!captcha || !plan?.canManualBumpNow) return;

    setSubmitting(true);
    try {
      const result = await manualBumpAdvertisement(captcha.captchaId, captchaInput);
      toast({ title: t('professorDashboard.manualBump.success', 'Your ad was moved to the top of the list.') });
      setCaptcha(null);
      setCaptchaInput('');
      setPlan((prev) =>
        prev
          ? {
              ...prev,
              canManualBumpNow: false,
              lastManualBumpAtUtc: result.bumpedAtUtc || new Date().toISOString(),
              nextManualBumpAtUtc: result.nextManualBumpAtUtc ?? prev.nextManualBumpAtUtc,
              manualBumpCooldownMinutes: result.manualBumpCooldownMinutes ?? prev.manualBumpCooldownMinutes,
            }
          : prev
      );
      void loadPlan({ silent: true });
    } catch {
      toast({
        title: t('professorDashboard.manualBump.submitError', 'Manual update failed. Check the captcha or wait for cooldown.'),
        variant: 'destructive',
      });
      await loadCaptcha();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const cooldownMinutes = plan?.manualBumpCooldownMinutes ?? 25;
  const canBump = Boolean(plan?.canManualBumpNow);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-headline text-2xl font-bold">
            {t('professorDashboard.manualBump.title', 'Manual update')}
          </h1>
          <p className="text-muted-foreground">
            {t(
              'professorDashboard.manualBump.subtitle',
              'Move your approved ad to the top of the public list. Available once every 25 minutes.'
            )}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/professor/advertisements">
            {t('professorDashboard.manualBump.backToAd', 'Back to advertisement')}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            {t('professorDashboard.manualBump.cardTitle', 'Manual listing update')}
          </CardTitle>
          <CardDescription>
            {t(
              'professorDashboard.manualBump.cardDesc',
              `Enter the security code to refresh your ad position. You can use this every ${cooldownMinutes} minutes.`
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!canBump ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              {secondsLeft > 0 ? (
                <p>
                  {t('professorDashboard.manualBump.cooldown', 'Next manual update available in')}{' '}
                  <span className="font-mono font-semibold text-foreground">{formatCountdown(secondsLeft, lang)}</span>
                </p>
              ) : (
                <p>{t('professorDashboard.manualBump.notReady', 'Your ad must be approved and public to use manual update.')}</p>
              )}
            </div>
          ) : (
            <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
              <div className="space-y-2">
                <Label htmlFor="manual-bump-captcha">
                  {t('professorDashboard.manualBump.captchaLabel', 'Security code')}
                </Label>
                <div className="flex flex-wrap items-center gap-3">
                  <div
                    className="select-none rounded-md border bg-muted px-6 py-3 font-mono text-2xl font-bold tracking-[0.35em] text-primary"
                    aria-hidden="true"
                  >
                    {loadingCaptcha ? '······' : captcha?.displayCode ?? '······'}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => void loadCaptcha()}
                    disabled={loadingCaptcha || submitting}
                    aria-label={t('professorDashboard.manualBump.refreshCaptcha', 'Refresh code')}
                  >
                    {loadingCaptcha ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manual-bump-input">
                  {t('professorDashboard.manualBump.inputLabel', 'Enter the code above')}
                </Label>
                <Input
                  id="manual-bump-input"
                  value={captchaInput}
                  onChange={(event) => setCaptchaInput(event.target.value.toUpperCase())}
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={6}
                  placeholder={t('professorDashboard.manualBump.inputPlaceholder', 'ABC123')}
                  disabled={submitting || loadingCaptcha}
                />
              </div>

              <Button type="submit" disabled={submitting || loadingCaptcha || captchaInput.trim().length < 6}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t('professorDashboard.manualBump.submit', 'Update my ad now')}
              </Button>
            </form>
          )}

          {plan?.lastManualBumpAtUtc ? (
            <p className="text-xs text-muted-foreground">
              {t('professorDashboard.manualBump.lastBump', 'Last manual update')}:{' '}
              {new Date(plan.lastManualBumpAtUtc).toLocaleString(lang === 'en' ? 'en-US' : 'fa-IR')}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
