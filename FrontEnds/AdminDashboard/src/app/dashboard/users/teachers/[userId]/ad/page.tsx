'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft, Loader2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import { asLongId, isValidLongId } from '@/lib/id';
import { formatLocalizedCurrency, formatLocalizedNumber } from '@/lib/utils/localized-ui';
import { grantTeacherAdvertisementPlan } from '@/services/admin-teachers-api.service';
import {
  getAdvertisementMonetizationAdmin,
  type TariffRow,
} from '@/services/advertisement-monetization-service';

function finalTariffPrice(priceToman: number, discountPercent: number) {
  if (discountPercent <= 0) return priceToman;
  return Math.round(priceToman * (1 - discountPercent / 100));
}

export default function TeacherAdPlanPage() {
  const params = useParams();
  const userId = asLongId(params.userId);
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const [tariffs, setTariffs] = React.useState<TariffRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [assigningId, setAssigningId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isValidLongId(userId)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void getAdvertisementMonetizationAdmin()
      .then((data) => setTariffs(data.tariffs.filter((row) => row.isActive)))
      .catch(() => setTariffs([]))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleAssign = async (tariffId: string) => {
    if (!isValidLongId(tariffId)) return;
    setAssigningId(tariffId);
    try {
      await grantTeacherAdvertisementPlan({ userId, tariffId: Number(tariffId) });
      toast({ title: t('teacher_ad_assign_success') });
    } catch {
      toast({ title: t('teacher_ad_assign_failed'), variant: 'destructive' });
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/users/teachers">
          <ChevronLeft className="mr-2 h-4 w-4" />
          {t('portal_students_back')}
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{t('teacher_ad_assign_title')}</CardTitle>
          <CardDescription>{t('teacher_ad_assign_description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tariffs.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">{t('teacher_ad_plans_empty')}</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {tariffs.map((plan) => {
                const finalPrice = finalTariffPrice(plan.priceToman, plan.discountPercent);
                const busy = assigningId === plan.id;
                return (
                  <Card key={plan.id} className="border shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-base">
                        <span>
                          {formatLocalizedNumber(plan.durationMonths, locale)} {t('teacher_ad_months')}
                        </span>
                        <Badge variant="secondary" className="gap-1">
                          <Star className="h-3 w-3 fill-current" />
                          {formatLocalizedNumber(plan.starLevel, locale)}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-2xl font-bold">
                          {formatLocalizedCurrency(finalPrice, locale, t)}
                        </p>
                        {plan.discountPercent > 0 ? (
                          <p className="text-sm text-muted-foreground line-through">
                            {formatLocalizedCurrency(plan.priceToman, locale, t)}
                          </p>
                        ) : null}
                      </div>
                      <Button
                        className="w-full"
                        disabled={busy}
                        onClick={() => void handleAssign(plan.id)}
                      >
                        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {t('teacher_ad_assign_button')}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
