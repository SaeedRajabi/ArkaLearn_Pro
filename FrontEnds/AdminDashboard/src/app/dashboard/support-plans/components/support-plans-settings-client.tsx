'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import {
  fetchSupportPlanTariffs,
  grantStudentSupportMonths,
  saveSupportPlanTariffs,
  type SupportPlanFeatureRow,
  type SupportPlanTariffRow,
} from '@/services/support-subscription-api.service';

const DURATIONS = [1, 3, 6] as const;

function emptyFeatures(): SupportPlanFeatureRow[] {
  return [];
}

export function SupportPlansSettingsClient() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [rows, setRows] = React.useState<Record<number, SupportPlanTariffRow>>({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [grantUserId, setGrantUserId] = React.useState('');
  const [grantMonths, setGrantMonths] = React.useState(3);

  React.useEffect(() => {
    void fetchSupportPlanTariffs()
      .then((list) => {
        const map: Record<number, SupportPlanTariffRow> = {};
        for (const duration of DURATIONS) {
          const found = list.find((x) => x.durationMonths === duration);
          map[duration] = found ?? {
            id: 0,
            durationMonths: duration,
            priceToman: 0,
            isActive: true,
            features: emptyFeatures(),
          };
        }
        // Prefer richest feature catalog from first loaded plan
        const catalog =
          list.find((x) => (x.features?.length ?? 0) > 0)?.features ??
          list.flatMap((x) => x.features ?? []);
        for (const duration of DURATIONS) {
          if ((map[duration].features?.length ?? 0) === 0 && catalog.length > 0) {
            map[duration] = {
              ...map[duration],
              features: catalog.map((f) => ({ ...f })),
            };
          }
        }
        setRows(map);
      })
      .finally(() => setLoading(false));
  }, []);

  const updateFeature = (
    duration: number,
    featureCode: string,
    patch: Partial<SupportPlanFeatureRow>
  ) => {
    setRows((prev) => {
      const current = prev[duration];
      return {
        ...prev,
        [duration]: {
          ...current,
          durationMonths: duration,
          features: (current.features ?? []).map((f) =>
            f.featureCode === featureCode ? { ...f, ...patch } : f
          ),
        },
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSupportPlanTariffs(
        DURATIONS.map((duration) => ({
          durationMonths: duration,
          priceToman: Number(rows[duration]?.priceToman ?? 0),
          isActive: rows[duration]?.isActive !== false,
          features: (rows[duration]?.features ?? []).map((f) => ({
            featureCode: f.featureCode,
            isOffered: f.isOffered !== false,
            addonPriceToman: Math.max(0, Number(f.addonPriceToman) || 0),
          })),
        }))
      );
      toast({ title: t('support_plans_saved') });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: err instanceof Error ? err.message : t('support_plans_save_failed'),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleGrant = async () => {
    if (!grantUserId.trim()) return;
    setSaving(true);
    try {
      await grantStudentSupportMonths(grantUserId.trim(), grantMonths);
      toast({ title: t('support_grant_success') });
      setGrantUserId('');
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: err instanceof Error ? err.message : t('support_grant_failed'),
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">{t('loading')}</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('support_plans_title')}</CardTitle>
          <CardDescription>
            {t('support_plans_desc_features')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {DURATIONS.map((duration) => (
              <div key={duration} className="space-y-3 rounded-lg border p-4">
                <p className="font-medium">
                  {duration} {t('support_plans_months')}
                </p>
                <div className="space-y-1">
                  <Label>{t('support_plans_price_toman')} (پایه)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={rows[duration]?.priceToman ?? 0}
                    onChange={(e) =>
                      setRows((prev) => ({
                        ...prev,
                        [duration]: {
                          ...prev[duration],
                          durationMonths: duration,
                          priceToman: Math.max(0, Number(e.target.value) || 0),
                          isActive: prev[duration]?.isActive !== false,
                          features: prev[duration]?.features ?? [],
                        },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>{t('support_plans_active')}</Label>
                  <Switch
                    checked={rows[duration]?.isActive !== false}
                    onCheckedChange={(checked) =>
                      setRows((prev) => ({
                        ...prev,
                        [duration]: {
                          ...prev[duration],
                          durationMonths: duration,
                          isActive: checked,
                          features: prev[duration]?.features ?? [],
                        },
                      }))
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          {DURATIONS.map((duration) => (
            <div key={`features-${duration}`} className="space-y-3 rounded-xl border p-4">
              <div>
                <h3 className="font-semibold">
                  فیچرهای پلن {duration} {t('support_plans_months')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  فیچر فعال در پلن نمایش داده می‌شود؛ مبلغ افزایشی هنگام تیک‌زدن دانشجو به قیمت پایه اضافه می‌شود.
                </p>
              </div>
              <div className="grid gap-3">
                {(rows[duration]?.features ?? []).map((feature) => (
                  <div
                    key={feature.featureCode}
                    className="grid gap-3 rounded-lg border bg-muted/20 p-3 md:grid-cols-[1fr_auto_160px] md:items-center"
                  >
                    <div>
                      <p className="font-medium">{feature.titleFa || feature.featureCode}</p>
                      <p className="text-xs text-muted-foreground">{feature.descriptionFa}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={feature.isOffered !== false}
                        onCheckedChange={(checked) =>
                          updateFeature(duration, feature.featureCode, { isOffered: checked })
                        }
                      />
                      <span className="text-sm">ارائه در پلن</span>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">مبلغ افزایشی (تومان)</Label>
                      <Input
                        type="number"
                        min={0}
                        disabled={feature.isOffered === false}
                        value={feature.addonPriceToman ?? 0}
                        onChange={(e) =>
                          updateFeature(duration, feature.featureCode, {
                            addonPriceToman: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                      />
                    </div>
                  </div>
                ))}
                {(rows[duration]?.features?.length ?? 0) === 0 && (
                  <p className="text-sm text-muted-foreground">
                    هنوز فیچری از سرور دریافت نشده. پس از ذخیره/بارگذاری مجدد API، لیست ظاهر می‌شود.
                  </p>
                )}
              </div>
            </div>
          ))}

          <Button onClick={() => void handleSave()} disabled={saving}>
            {t('support_plans_save')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('support_grant_title')}</CardTitle>
          <CardDescription>{t('support_grant_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <Label>{t('support_grant_student_user_id')}</Label>
            <Input value={grantUserId} onChange={(e) => setGrantUserId(e.target.value)} dir="ltr" />
          </div>
          <div className="space-y-1">
            <Label>{t('support_grant_months')}</Label>
            <Input
              type="number"
              min={1}
              max={24}
              value={grantMonths}
              onChange={(e) => setGrantMonths(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
          <div className="flex items-end">
            <Button variant="secondary" onClick={() => void handleGrant()} disabled={saving}>
              {t('support_grant_submit')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
