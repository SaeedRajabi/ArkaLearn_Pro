'use client';

import * as React from 'react';
import Link from 'next/link';
import { Loader2, Sparkles, Star, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getDictValue } from '@/lib/i18n-client';
import {
  getAdvertisementAutoBumpPackages,
  getAdvertisementTariffs,
  getMyAdvertisementPlan,
  redeemXpFreeMonth,
  type AdvertisementTariff,
  type AutoBumpPackage,
  type MyAdvertisementPlan,
} from '@/lib/api/advertisement-monetization';
import {
  requestAdAutoBumpPackagePayment,
  requestAdOneTimeBumpPayment,
  requestAdSubscriptionPayment,
} from '@/lib/api/payments';
import type { Dictionary } from '@/types';

const DURATIONS = [1, 2, 3, 6, 12];
const STARS = [1, 2, 3, 4, 5, 6, 7];

function formatToman(value: number, lang: string) {
  return lang === 'en' ? `${value.toLocaleString()} Toman` : `${value.toLocaleString('fa-IR')} تومان`;
}

function finalTariffPrice(priceToman: number, discountPercent: number) {
  if (discountPercent <= 0) return priceToman;
  return Math.round(priceToman * (100 - discountPercent) / 100);
}

export function ProfessorAdvertisementPlansClient({ dict }: { dict: Dictionary }) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [plan, setPlan] = React.useState<MyAdvertisementPlan | null>(null);
  const [tariffs, setTariffs] = React.useState<AdvertisementTariff[]>([]);
  const [bumpPackages, setBumpPackages] = React.useState<AutoBumpPackage[]>([]);
  const [buyingId, setBuyingId] = React.useState<number | null>(null);
  const [buyingBumpPackageId, setBuyingBumpPackageId] = React.useState<number | null>(null);
  const [buyingOneTimeBump, setBuyingOneTimeBump] = React.useState(false);
  const [redeeming, setRedeeming] = React.useState(false);
  const lang = String((dict as Record<string, unknown>).lang ?? 'fa');

  const t = (key: string, fallback: string) => getDictValue(dict, key, fallback);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [planData, tariffData, bumpData] = await Promise.all([
        getMyAdvertisementPlan(),
        getAdvertisementTariffs(),
        getAdvertisementAutoBumpPackages(),
      ]);
      setPlan(planData);
      setTariffs(tariffData.filter((x) => x.isActive));
      setBumpPackages(bumpData.filter((x) => x.isActive));
    } catch {
      toast({ title: t('professorDashboard.adPlans.loadError', 'Failed to load plans'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast, dict]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const tariffAt = (months: number, star: number) =>
    tariffs.find((x) => x.durationMonths === months && x.starLevel === star);

  const handleBuy = async (tariffId: number) => {
    setBuyingId(tariffId);
    try {
      const { paymentUrl } = await requestAdSubscriptionPayment(tariffId);
      if (paymentUrl) window.location.href = paymentUrl;
    } catch {
      toast({ title: t('professorDashboard.adPlans.buyError', 'Could not start payment'), variant: 'destructive' });
    } finally {
      setBuyingId(null);
    }
  };

  const handleBuyOneTimeBump = async () => {
    setBuyingOneTimeBump(true);
    try {
      const { paymentUrl } = await requestAdOneTimeBumpPayment();
      if (paymentUrl) window.location.href = paymentUrl;
    } catch {
      toast({ title: t('professorDashboard.adPlans.bumpBuyError', 'Could not start bump payment'), variant: 'destructive' });
    } finally {
      setBuyingOneTimeBump(false);
    }
  };

  const handleBuyBumpPackage = async (packageId: number) => {
    setBuyingBumpPackageId(packageId);
    try {
      const { paymentUrl } = await requestAdAutoBumpPackagePayment(packageId);
      if (paymentUrl) window.location.href = paymentUrl;
    } catch {
      toast({ title: t('professorDashboard.adPlans.bumpBuyError', 'Could not start bump payment'), variant: 'destructive' });
    } finally {
      setBuyingBumpPackageId(null);
    }
  };

  const handleRedeemXp = async () => {
    setRedeeming(true);
    try {
      await redeemXpFreeMonth();
      toast({ title: t('professorDashboard.adPlans.xpRedeemed', 'One free month activated!') });
      await load();
    } catch {
      toast({ title: t('professorDashboard.adPlans.xpRedeemError', 'Not enough XP'), variant: 'destructive' });
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-headline text-2xl font-bold">{t('professorDashboard.adPlans.title', 'Advertisement plans')}</h1>
          <p className="text-muted-foreground">{t('professorDashboard.adPlans.subtitle', 'Upgrade your listing or use XP for a free month.')}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/professor/advertisements">{t('professorDashboard.adPlans.backToAd', 'Back to advertisement')}</Link>
        </Button>
      </div>

      {plan ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {t('professorDashboard.adPlans.currentPlan', 'Current plan')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 text-sm">
            <Badge variant={plan.hasPaidFeatures ? 'default' : 'secondary'}>
              {plan.hasPaidFeatures
                ? t('professorDashboard.adPlans.paid', 'Paid')
                : t('professorDashboard.adPlans.free', 'Free')}
            </Badge>
            {plan.activeStarLevel > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Star className="h-4 w-4 text-amber-500" />
                {plan.activeStarLevel} {t('professorDashboard.adPlans.stars', 'stars')}
              </span>
            ) : null}
            <span>{t('professorDashboard.adPlans.xp', 'XP')}: {plan.experiencePoints}</span>
            <span>
              {t('professorDashboard.adPlans.xpNext', 'Next free month')}: {plan.xpNextFreeMonthThreshold} XP
            </span>
            {plan.subscriptionExpiresAtUtc ? (
              <span>{t('professorDashboard.adPlans.expires', 'Expires')}: {new Date(plan.subscriptionExpiresAtUtc).toLocaleDateString()}</span>
            ) : null}
            {plan.autoBumpExpiresAtUtc ? (
              <span>{t('professorDashboard.adPlans.autoBumpExpires', 'Auto-bump until')}: {new Date(plan.autoBumpExpiresAtUtc).toLocaleDateString()}</span>
            ) : null}
            {plan.experiencePoints >= plan.xpNextFreeMonthThreshold ? (
              <Button size="sm" onClick={() => void handleRedeemXp()} disabled={redeeming}>
                {redeeming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t('professorDashboard.adPlans.redeemXp', 'Use XP for 1 free month')}
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            {t('professorDashboard.adPlans.bumpTitle', 'Bump your listing')}
          </CardTitle>
          <CardDescription>
            {t('professorDashboard.adPlans.bumpDesc', 'Move your ad higher in search results while auto-bump is active.')}
            {' '}
            ({plan?.autoBumpIntervalMinutes ?? 60} {t('professorDashboard.adPlans.bumpInterval', 'min interval')})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
            <div>
              <p className="font-medium">{t('professorDashboard.adPlans.oneTimeBump', 'One-time bump')}</p>
              <p className="text-sm text-muted-foreground">
                {formatToman(plan?.oneTimeBumpPriceToman ?? 50000, lang)}
              </p>
            </div>
            <Button onClick={() => void handleBuyOneTimeBump()} disabled={buyingOneTimeBump}>
              {buyingOneTimeBump ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('professorDashboard.adPlans.buyBump', 'Buy bump')}
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {bumpPackages.map((pkg) => (
              <div key={pkg.id} className="flex flex-col justify-between gap-3 rounded-lg border p-4">
                <div>
                  <p className="font-medium">{pkg.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {pkg.durationDays} {t('professorDashboard.adPlans.days', 'days')} — {formatToman(pkg.priceToman, lang)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => void handleBuyBumpPackage(pkg.id)}
                  disabled={buyingBumpPackageId === pkg.id}
                >
                  {buyingBumpPackageId === pkg.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {t('professorDashboard.adPlans.buy', 'Buy')}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('professorDashboard.adPlans.tariffMatrix', 'Pricing matrix')}</CardTitle>
          <CardDescription>{t('professorDashboard.adPlans.tariffMatrixDesc', 'Star level × duration (Toman)')}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-start">{t('professorDashboard.adPlans.stars', 'Stars')}</th>
                {DURATIONS.map((m) => (
                  <th key={m} className="p-2 text-center">{m} {t('professorDashboard.adPlans.months', 'mo')}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STARS.map((star) => (
                <tr key={star} className="border-b">
                  <td className="p-2 font-medium">
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-amber-500" />
                      {star}
                    </span>
                  </td>
                  {DURATIONS.map((months) => {
                    const row = tariffAt(months, star);
                    if (!row) return <td key={months} className="p-2 text-center text-muted-foreground">—</td>;
                    const finalPrice = finalTariffPrice(row.priceToman, row.discountPercent);
                    return (
                      <td key={months} className="p-2 text-center">
                        <div className="space-y-1">
                          {row.discountPercent > 0 ? (
                            <div className="text-xs text-muted-foreground line-through">
                              {formatToman(row.priceToman, lang)}
                            </div>
                          ) : null}
                          <div className="font-medium">{formatToman(finalPrice, lang)}</div>
                          {row.discountPercent > 0 ? (
                            <Badge variant="secondary" className="text-xs">-{row.discountPercent}%</Badge>
                          ) : null}
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={buyingId === row.id}
                            onClick={() => void handleBuy(row.id)}
                          >
                            {buyingId === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : t('professorDashboard.adPlans.buy', 'Buy')}
                          </Button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
