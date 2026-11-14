'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft, Loader2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import { asLongId, isValidLongId } from '@/lib/id';
import { formatLocalizedCurrency, formatLocalizedNumber } from '@/lib/utils/localized-ui';
import { grantTeacherAutoBumpPlan } from '@/services/admin-teachers-api.service';
import {
  getAdvertisementMonetizationAdmin,
  type AutoBumpPackageRow,
} from '@/services/advertisement-monetization-service';

export default function TeacherAutoBumpPage() {
  const params = useParams();
  const userId = asLongId(params.userId);
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const [packages, setPackages] = React.useState<AutoBumpPackageRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [assigningId, setAssigningId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isValidLongId(userId)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void getAdvertisementMonetizationAdmin()
      .then((data) => setPackages(data.autoBumpPackages.filter((row) => row.isActive)))
      .catch(() => setPackages([]))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleAssign = async (packageId: string) => {
    if (!isValidLongId(packageId)) return;
    setAssigningId(packageId);
    try {
      await grantTeacherAutoBumpPlan({ userId, packageId: Number(packageId) });
      toast({ title: t('teacher_auto_bump_assign_success') });
    } catch {
      toast({ title: t('teacher_auto_bump_assign_failed'), variant: 'destructive' });
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
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('teacher_auto_bump_assign_title')}
          </CardTitle>
          <CardDescription>{t('teacher_auto_bump_assign_description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : packages.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">{t('teacher_auto_bump_plans_empty')}</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {packages.map((pkg) => {
                const busy = assigningId === pkg.id;
                return (
                  <Card key={pkg.id} className="border shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{pkg.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>
                          {t('teacher_auto_bump_duration')}:{' '}
                          {formatLocalizedNumber(pkg.durationDays, locale)} {t('teacher_auto_bump_days')}
                        </p>
                        <p className="text-lg font-semibold text-foreground">
                          {formatLocalizedCurrency(pkg.priceToman, locale, t)}
                        </p>
                      </div>
                      <Button
                        className="w-full"
                        disabled={busy}
                        onClick={() => void handleAssign(pkg.id)}
                      >
                        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {t('teacher_auto_bump_assign_button')}
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
