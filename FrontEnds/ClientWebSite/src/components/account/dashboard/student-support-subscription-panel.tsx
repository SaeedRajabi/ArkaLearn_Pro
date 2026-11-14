'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/hooks/use-toast';
import {
  calculatePlanTotal,
  fetchMySupportSubscriptionStatus,
  purchaseSupportPlan,
  requestSupportFreeze,
  type StudentSupportStatus,
  type SupportPlanTariff,
} from '@/lib/api/support-subscription';

function formatToman(value: number) {
  return new Intl.NumberFormat('fa-IR').format(value);
}

function SupportSubscriptionSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-5 w-72 max-w-full" />
          <Skeleton className="h-4 w-56 max-w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export function StudentSupportSubscriptionPanel() {
  const { t, formatDate } = useLanguage();
  const { toast } = useToast();
  const [status, setStatus] = React.useState<StudentSupportStatus | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [freezeDays, setFreezeDays] = React.useState(10);
  const [freezeReason, setFreezeReason] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [purchasingPlanId, setPurchasingPlanId] = React.useState<number | null>(null);
  const [selectedByPlan, setSelectedByPlan] = React.useState<Record<number, string[]>>({});

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const next = await fetchMySupportSubscriptionStatus();
      setStatus(next);
      setSelectedByPlan((prev) => {
        const merged: Record<number, string[]> = { ...prev };
        for (const plan of next.plans) {
          if (!merged[plan.id]) merged[plan.id] = [];
        }
        return merged;
      });
    } catch {
      toast({
        variant: 'destructive',
        title: t('supportSubscription.loadFailed', 'Could not load support subscription'),
      });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const toggleFeature = (plan: SupportPlanTariff, featureCode: string, checked: boolean) => {
    setSelectedByPlan((prev) => {
      const current = new Set(prev[plan.id] ?? []);
      if (checked) current.add(featureCode);
      else current.delete(featureCode);
      return { ...prev, [plan.id]: Array.from(current) };
    });
  };

  const handleFreeze = async () => {
    setSubmitting(true);
    try {
      await requestSupportFreeze({ freezeDays, reason: freezeReason.trim() });
      toast({ title: t('supportSubscription.freezeStarted', 'Support freeze started') });
      setFreezeReason('');
      await load();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('supportSubscription.freezeFailed', 'Could not start freeze'),
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePurchase = async (plan: SupportPlanTariff) => {
    if (purchasingPlanId != null) return;
    setPurchasingPlanId(plan.id);
    try {
      await purchaseSupportPlan(plan.id, selectedByPlan[plan.id] ?? []);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('supportSubscription.buyFailed', 'Could not start payment'),
        description: err instanceof Error ? err.message : undefined,
      });
      setPurchasingPlanId(null);
    }
  };

  if (loading) {
    return <SupportSubscriptionSkeleton />;
  }

  if (!status) return null;

  const canFreeze =
    status.hasActiveAccess &&
    !status.isFrozen &&
    status.freezeCountRemaining > 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('supportSubscription.title', 'Support subscription')}</CardTitle>
          <CardDescription>
            {t('supportSubscription.subtitle', 'Manage your online support access, freeze, and renewal.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {status.isFrozen ? (
            <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
              {t('supportSubscription.frozenUntil', 'Support is frozen until')}{' '}
              <strong>{formatDate(status.frozenUntilUtc, 'long')}</strong>
            </p>
          ) : status.hasActiveAccess ? (
            <p>
              {t('supportSubscription.activeUntil', 'Active until')}{' '}
              <strong>{formatDate(status.accessEndsAtUtc, 'long')}</strong>
              {' '}({status.remainingDays} {t('supportSubscription.daysLeft', 'days left')})
            </p>
          ) : (
            <p className="text-destructive">
              {t('supportSubscription.inactive', 'Your support access has expired. Purchase a plan below.')}
            </p>
          )}
          <p className="text-muted-foreground">
            {t('supportSubscription.freezeRemaining', 'Freezes remaining')}: {status.freezeCountRemaining} / 2
          </p>
          {status.activeFeatureCodes.length > 0 && (
            <div className="rounded-md border p-3">
              <p className="mb-2 font-medium">
                {t('supportSubscription.activeFeatures', 'Active VIP features')}
              </p>
              <ul className="list-disc space-y-1 pe-5 text-muted-foreground">
                {status.activeFeatureCodes.map((code) => {
                  const title =
                    status.plans
                      .flatMap((p) => p.features)
                      .find((f) => f.featureCode === code)?.titleFa ?? code;
                  return <li key={code}>{title}</li>;
                })}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {canFreeze && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('supportSubscription.freezeTitle', 'Request freeze')}</CardTitle>
            <CardDescription>
              {t('supportSubscription.freezeDesc', 'Pause support for 7–30 days without losing remaining time. Max 2 times.')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>{t('supportSubscription.freezeDays', 'Freeze duration (days)')}</Label>
              <Input
                type="number"
                min={7}
                max={30}
                value={freezeDays}
                onChange={(e) => setFreezeDays(Math.min(30, Math.max(7, Number(e.target.value) || 7)))}
              />
            </div>
            <div className="space-y-1">
              <Label>{t('supportSubscription.freezeReason', 'Reason')}</Label>
              <Textarea
                value={freezeReason}
                onChange={(e) => setFreezeReason(e.target.value)}
                rows={3}
                placeholder={t('supportSubscription.freezeReasonPlaceholder', 'Explain why you need to pause support...')}
              />
            </div>
            <Button type="button" disabled={submitting || freezeReason.trim().length < 5} onClick={() => void handleFreeze()}>
              {t('supportSubscription.freezeSubmit', 'Start freeze')}
            </Button>
          </CardContent>
        </Card>
      )}

      {(!status.hasActiveAccess || status.isFrozen) && status.plans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('supportSubscription.plansTitle', 'Support plans')}</CardTitle>
            <CardDescription>
              {t(
                'supportSubscription.plansDesc',
                'قیمت پایه را ببینید، فیچرهای موردنیاز را انتخاب کنید و مبلغ نهایی به‌صورت خودکار محاسبه می‌شود.'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-3">
            {status.plans.map((plan) => {
              const selected = selectedByPlan[plan.id] ?? [];
              const total = calculatePlanTotal(plan, selected);
              return (
                <div key={plan.id} className="flex flex-col gap-3 rounded-xl border p-4">
                  <div>
                    <p className="font-semibold">
                      {plan.durationMonths} {t('supportSubscription.months', 'month(s)')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('supportSubscription.basePrice', 'Base')}: {formatToman(plan.priceToman)}{' '}
                      {t('supportSubscription.toman', 'Toman')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {plan.features.map((feature) => {
                      const checked = selected.includes(feature.featureCode);
                      return (
                        <label
                          key={feature.featureCode}
                          className="flex cursor-pointer gap-3 rounded-lg border p-3 hover:bg-muted/40"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) =>
                              toggleFeature(plan, feature.featureCode, value === true)
                            }
                          />
                          <span className="min-w-0 flex-1 space-y-1">
                            <span className="block text-sm font-medium">{feature.titleFa}</span>
                            <span className="block text-xs text-muted-foreground">{feature.descriptionFa}</span>
                            <span className="block text-xs font-medium text-primary">
                              +{formatToman(feature.addonPriceToman)} {t('supportSubscription.toman', 'Toman')}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                    {plan.features.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        {t('supportSubscription.noOptionalFeatures', 'No optional features for this plan.')}
                      </p>
                    )}
                  </div>

                  <div className="mt-auto space-y-2 border-t pt-3">
                    <p className="text-sm font-semibold">
                      {t('supportSubscription.total', 'Total')}: {formatToman(total)}{' '}
                      {t('supportSubscription.toman', 'Toman')}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      className="w-full"
                      loading={purchasingPlanId === plan.id}
                      loadingText={t('supportSubscription.buying', 'Redirecting...')}
                      disabled={purchasingPlanId != null && purchasingPlanId !== plan.id}
                      onClick={() => void handlePurchase(plan)}
                    >
                      {t('supportSubscription.buy', 'Purchase')}
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
