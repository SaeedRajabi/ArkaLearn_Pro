'use client';

import * as React from 'react';
import Link from 'next/link';
import { Loader2, Megaphone, RefreshCw, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getDictValue } from '@/lib/i18n-client';
import { getMyAdvertisementPlan, type MyAdvertisementPlan } from '@/lib/api/advertisement-monetization';
import { useLanguage } from '@/contexts/language-context';
import type { Dictionary } from '@/types';
import { cn } from '@/lib/utils';

let cachedAdPlan: MyAdvertisementPlan | null = null;

function formatDateTime(value: string | null | undefined, localeTag: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(localeTag, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StarRow({ count, max = 7 }: { count: number; max?: number }) {
  const stars = Math.max(0, Math.min(max, count));
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${stars} stars`}>
      {Array.from({ length: stars }).map((_, index) => (
        <Star key={index} className="h-4 w-4 fill-amber-400 text-amber-400" />
      ))}
    </span>
  );
}

function shouldShowPanel(plan: MyAdvertisementPlan): boolean {
  if (plan.hasActiveSubscription || plan.hasActiveAutoBump) return true;
  if (plan.planType === 'xp_free' && plan.xpFreePlanUntilUtc) return true;
  return plan.hasPaidFeatures && plan.activeStarLevel > 0;
}

function StatusRow({
  label,
  value,
  isRtl,
}: {
  label: string;
  value: React.ReactNode;
  isRtl: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-0.5 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between',
        isRtl && 'sm:flex-row-reverse'
      )}
    >
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className={cn('text-sm font-semibold text-foreground', isRtl && 'text-right')}>{value}</span>
    </div>
  );
}

export function ProfessorAdPlanStatusPanel({ dict }: { dict: Dictionary }) {
  const { locale } = useLanguage();
  const isRtl = locale === 'fa';
  const localeTag = isRtl ? 'fa-IR' : 'en-US';
  const t = (key: string, fallback: string) => getDictValue(dict, key, fallback);

  const [loading, setLoading] = React.useState(!cachedAdPlan);
  const [plan, setPlan] = React.useState<MyAdvertisementPlan | null>(cachedAdPlan);

  const load = React.useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent && !cachedAdPlan) setLoading(true);
    try {
      const next = await getMyAdvertisementPlan();
      if (next) {
        cachedAdPlan = next;
        setPlan(next);
      }
    } catch {
      if (!cachedAdPlan) setPlan(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load({ silent: !!cachedAdPlan });
  }, [load]);

  if (loading && !plan) {
    return (
      <Card className="rounded-2xl border-dashed">
        <CardContent className="flex min-h-[140px] items-center justify-center py-8">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!plan || !shouldShowPanel(plan)) return null;

  const showSubscription =
    plan.hasActiveSubscription || (plan.planType === 'xp_free' && !!plan.xpFreePlanUntilUtc);
  const subscriptionStart = plan.hasActiveSubscription
    ? plan.subscriptionStartedAtUtc
    : plan.planType === 'xp_free'
      ? undefined
      : plan.subscriptionStartedAtUtc;
  const subscriptionEnd = plan.hasActiveSubscription
    ? plan.subscriptionExpiresAtUtc
    : plan.xpFreePlanUntilUtc ?? plan.subscriptionExpiresAtUtc;

  return (
    <section className="space-y-4" aria-labelledby="professor-ad-plan-status-title">
      <div className={cn('flex flex-wrap items-center justify-between gap-3', isRtl && 'flex-row-reverse')}>
        <div className={isRtl ? 'text-right' : 'text-left'}>
          <h2 id="professor-ad-plan-status-title" className="text-lg font-bold tracking-tight">
            {t('professorDashboard.adPlanStatus.title', 'Advertising plan status')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t(
              'professorDashboard.adPlanStatus.subtitle',
              'Your active advertisement plan and automatic listing updates.'
            )}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/professor/advertisement-plans">
            {t('professorDashboard.adPlans.viewPlans', 'View plans & upgrade')}
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {showSubscription ? (
          <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Megaphone className="h-5 w-5 text-primary" />
                {t('professorDashboard.adPlanStatus.subscriptionTitle', 'Advertisement plan')}
              </CardTitle>
              <CardDescription>
                {plan.planType === 'xp_free'
                  ? t('professorDashboard.adPlanStatus.xpFreePlan', 'Active via XP free month')
                  : t('professorDashboard.adPlanStatus.paidPlan', 'Paid advertisement subscription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <StatusRow
                label={t('professorDashboard.adPlanStatus.starLevel', 'Star level')}
                value={
                  <span className="inline-flex items-center gap-2">
                    <StarRow count={plan.activeStarLevel} />
                    <Badge variant="secondary" className="font-mono">
                      {plan.activeStarLevel}/7
                    </Badge>
                  </span>
                }
                isRtl={isRtl}
              />
              {plan.subscriptionDurationMonths > 0 ? (
                <StatusRow
                  label={t('professorDashboard.adPlanStatus.duration', 'Duration')}
                  value={t('professorDashboard.adPlanStatus.monthsCount', '{count} months').replace(
                    '{count}',
                    String(plan.subscriptionDurationMonths)
                  )}
                  isRtl={isRtl}
                />
              ) : null}
              {subscriptionStart ? (
                <StatusRow
                  label={t('professorDashboard.adPlanStatus.startedAt', 'Started')}
                  value={formatDateTime(subscriptionStart, localeTag)}
                  isRtl={isRtl}
                />
              ) : null}
              <StatusRow
                label={t('professorDashboard.adPlanStatus.expiresAt', 'Expires')}
                value={formatDateTime(subscriptionEnd, localeTag)}
                isRtl={isRtl}
              />
            </CardContent>
          </Card>
        ) : null}

        {plan.hasActiveAutoBump ? (
          <Card className="rounded-2xl border-amber-500/25 bg-gradient-to-br from-card to-amber-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <RefreshCw className="h-5 w-5 text-amber-600" />
                {t('professorDashboard.adPlanStatus.autoBumpTitle', 'Automatic update')}
              </CardTitle>
              <CardDescription>
                {plan.autoBumpIncludedWithSubscription
                  ? t(
                      'professorDashboard.adPlanStatus.autoBumpIncluded',
                      'Included with your advertisement plan'
                    )
                  : t(
                      'professorDashboard.adPlanStatus.autoBumpPackage',
                      'Automatic listing bump package'
                    )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <StatusRow
                label={t('professorDashboard.adPlanStatus.interval', 'Update interval')}
                value={t('professorDashboard.adPlanStatus.everyMinutes', 'Every {minutes} minutes').replace(
                  '{minutes}',
                  String(plan.autoBumpIntervalMinutes)
                )}
                isRtl={isRtl}
              />
              <StatusRow
                label={t('professorDashboard.adPlanStatus.startedAt', 'Started')}
                value={formatDateTime(plan.autoBumpStartedAtUtc, localeTag)}
                isRtl={isRtl}
              />
              <StatusRow
                label={t('professorDashboard.adPlanStatus.expiresAt', 'Expires')}
                value={formatDateTime(plan.autoBumpExpiresAtUtc, localeTag)}
                isRtl={isRtl}
              />
              <StatusRow
                label={t('professorDashboard.adPlanStatus.remainingBumps', 'Remaining updates')}
                value={
                  <Badge variant="outline" className="text-sm">
                    {plan.remainingAutoBumps}
                  </Badge>
                }
                isRtl={isRtl}
              />
              {plan.nextAutoBumpAtUtc ? (
                <StatusRow
                  label={t('professorDashboard.adPlanStatus.nextBump', 'Next automatic update')}
                  value={formatDateTime(plan.nextAutoBumpAtUtc, localeTag)}
                  isRtl={isRtl}
                />
              ) : null}
              {plan.lastAutoBumpAtUtc ? (
                <StatusRow
                  label={t('professorDashboard.adPlanStatus.lastBump', 'Last automatic update')}
                  value={formatDateTime(plan.lastAutoBumpAtUtc, localeTag)}
                  isRtl={isRtl}
                />
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </section>
  );
}
