'use client';

import * as React from 'react';
import {
  Coins,
  Contact,
  Gift,
  Loader2,
  Megaphone,
  Plus,
  Save,
  Sparkles,
  Star,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatLocalizedCurrency, formatLocalizedNumber } from '@/lib/utils/localized-ui';
import {
  extractApiErrorMessage,
  getAdvertisementMonetizationAdmin,
  saveAdvertisementMonetizationSettings,
  type AutoBumpPackageRow,
  type MonetizationAdminData,
  type TariffRow,
} from '@/services/advertisement-monetization-service';
import { useAuth } from '@/components/auth-provider';
import { isAdminDashboardRole } from '@/lib/auth/dashboard-access';

const DURATIONS = [1, 2, 3, 6, 12] as const;
const STARS = [1, 2, 3, 4, 5, 6, 7] as const;

function finalTariffPrice(priceToman: number, discountPercent: number) {
  if (discountPercent <= 0) return priceToman;
  return Math.round(priceToman * (1 - discountPercent / 100));
}

type SettingField = {
  key: keyof MonetizationAdminData['settings'];
  labelKey: string;
};

const CONTACT_FIELDS: SettingField[] = [
  { key: 'contactUnlockPriceToman', labelKey: 'ad_tariff_contact_unlock_price' },
  { key: 'contactUnlockHours', labelKey: 'ad_tariff_contact_unlock_hours' },
];

const FREE_PLAN_FIELDS: SettingField[] = [
  { key: 'freeMinTags', labelKey: 'ad_tariff_free_min_tags' },
  { key: 'freeMaxTags', labelKey: 'ad_tariff_free_max_tags' },
  { key: 'freeMaxWorkExperienceChars', labelKey: 'ad_tariff_free_max_work_experience_chars' },
  { key: 'freeMaxVideos', labelKey: 'ad_tariff_free_max_videos' },
  { key: 'freeMaxBooks', labelKey: 'ad_tariff_free_max_books' },
  { key: 'freeMaxArticles', labelKey: 'ad_tariff_free_max_articles' },
  { key: 'freeMaxDescriptionChars', labelKey: 'ad_tariff_free_max_description_chars' },
];

const XP_FIELDS: SettingField[] = [
  { key: 'xpFirstFreeMonthThreshold', labelKey: 'ad_tariff_xp_first_free_month' },
  { key: 'xpThresholdIncrementPerMonth', labelKey: 'ad_tariff_xp_increment' },
  { key: 'xpRewardSaveAdvertisement', labelKey: 'ad_tariff_xp_reward_save_ad' },
  { key: 'xpRewardSaveVideo', labelKey: 'ad_tariff_xp_reward_save_video' },
  { key: 'xpRewardSaveBook', labelKey: 'ad_tariff_xp_reward_save_book' },
  { key: 'xpRewardPublishCourse', labelKey: 'ad_tariff_xp_reward_publish_course' },
  { key: 'xpRewardPublishArticle', labelKey: 'ad_tariff_xp_reward_publish_article' },
  { key: 'xpRewardPortfolioArticle', labelKey: 'ad_tariff_xp_reward_portfolio_article' },
];

const BUMP_FIELDS: SettingField[] = [
  { key: 'autoBumpIntervalMinutes', labelKey: 'ad_tariff_auto_bump_interval' },
  { key: 'oneTimeBumpPriceToman', labelKey: 'ad_tariff_one_time_bump_price' },
];

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </span>
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</CardContent>
    </Card>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-10"
      />
    </div>
  );
}

function TariffCell({
  row,
  locale,
  t,
  onUpdate,
}: {
  row: TariffRow;
  locale: string;
  t: (key: string, params?: Record<string, string | number | boolean | null | undefined>) => string;
  onUpdate: (patch: Partial<Pick<TariffRow, 'priceToman' | 'discountPercent' | 'isActive'>>) => void;
}) {
  const finalPrice = finalTariffPrice(row.priceToman, row.discountPercent);

  return (
    <div
      className={cn(
        'min-w-[9.5rem] space-y-2.5 rounded-xl border bg-muted/20 p-3 transition-colors',
        row.isActive ? 'border-border' : 'border-dashed opacity-60'
      )}
    >
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{t('ad_tariff_price')}</Label>
        <Input
          type="number"
          className="h-9 text-center font-medium"
          value={row.priceToman}
          onChange={(e) => onUpdate({ priceToman: Number(e.target.value) })}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{t('ad_tariff_discount_percent')}</Label>
        <Input
          type="number"
          min={0}
          max={100}
          className="h-8 text-center text-sm"
          value={row.discountPercent}
          onChange={(e) => onUpdate({ discountPercent: Number(e.target.value) })}
        />
      </div>
      {row.discountPercent > 0 && (
        <div className="rounded-md bg-emerald-500/10 px-2 py-1.5 text-center text-xs text-emerald-700 dark:text-emerald-400">
          {t('ad_tariff_final_price')}: {formatLocalizedCurrency(finalPrice, locale, t)}
        </div>
      )}
      <div className="flex items-center justify-between gap-2 pt-1">
        <Badge variant={row.isActive ? 'success' : 'secondary'} className="text-xs">
          {row.isActive ? t('status_active') : t('status_inactive')}
        </Badge>
        <Switch checked={row.isActive} onCheckedChange={(checked) => onUpdate({ isActive: checked })} />
      </div>
    </div>
  );
}

export function AdvertisementTariffsClient() {
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const { authUser } = useAuth();
  const isAdmin = authUser != null && isAdminDashboardRole(authUser.roleName);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [data, setData] = React.useState<MonetizationAdminData | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      setData(await getAdvertisementMonetizationAdmin());
    } catch {
      toast({ title: t('ad_tariff_load_failed'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const updateSetting = (key: keyof MonetizationAdminData['settings'], value: number | boolean) => {
    setData((prev) => (prev ? { ...prev, settings: { ...prev.settings, [key]: value } } : prev));
  };

  const updateTariffField = (
    id: string,
    patch: Partial<Pick<TariffRow, 'priceToman' | 'discountPercent' | 'isActive'>>
  ) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        tariffs: prev.tariffs.map((row) => (row.id === id ? { ...row, ...patch } : row)),
      };
    });
  };

  const updateBumpPackage = (id: string, patch: Partial<AutoBumpPackageRow>) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        autoBumpPackages: prev.autoBumpPackages.map((pkg) => (pkg.id === id ? { ...pkg, ...patch } : pkg)),
      };
    });
  };

  const addBumpPackage = () => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        autoBumpPackages: [
          ...prev.autoBumpPackages,
          {
            id: `new-${Date.now()}`,
            name: t('ad_tariff_new_package_name'),
            durationDays: 14,
            priceToman: 200000,
            isActive: true,
          },
        ],
      };
    });
  };

  const removeBumpPackage = (id: string) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        autoBumpPackages: prev.autoBumpPackages.filter((pkg) => pkg.id !== id),
      };
    });
  };

  const tariffAt = (months: number, star: number): TariffRow | undefined =>
    data?.tariffs.find((row) => row.durationMonths === months && row.starLevel === star);

  const activeTariffCount = data?.tariffs.filter((row) => row.isActive).length ?? 0;
  const discountedTariffCount =
    data?.tariffs.filter((row) => row.isActive && row.discountPercent > 0).length ?? 0;

  const handleSave = async () => {
    if (!isAdmin) {
      toast({ title: t('ad_tariff_save_failed'), description: t('ad_tariff_admin_only'), variant: 'destructive' });
      return;
    }
    if (!data) return;
    setSaving(true);
    try {
      await saveAdvertisementMonetizationSettings({
        settings: data.settings,
        tariffs: data.tariffs.map((row) => ({
          id: row.id,
          priceToman: row.priceToman,
          discountPercent: row.discountPercent,
          isActive: row.isActive,
        })),
        autoBumpPackages: data.autoBumpPackages.map((p) => ({
          id: p.id.startsWith('new-') ? '0' : p.id,
          name: p.name,
          durationDays: p.durationDays,
          priceToman: p.priceToman,
          isActive: p.isActive,
        })),
      });
      toast({ title: t('ad_tariff_saved') });
      await load();
    } catch (error) {
      const detail = extractApiErrorMessage(error);
      toast({
        title: t('ad_tariff_save_failed'),
        description: detail,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const s = data.settings;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight xs:text-3xl">
            <Megaphone className="h-7 w-7 text-primary" />
            {t('ad_tariff_title')}
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">{t('ad_tariff_description')}</p>
        </div>
        <Button onClick={() => void handleSave()} disabled={saving || !isAdmin} className="shrink-0 gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {t('ad_tariff_save')}
        </Button>
      </div>

      {!isAdmin ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          {t('ad_tariff_admin_only')}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('ad_tariff_stat_active_tariffs')}</CardTitle>
            <Star className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatLocalizedNumber(activeTariffCount, locale)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('ad_tariff_stat_discounted')}</CardTitle>
            <Sparkles className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatLocalizedNumber(discountedTariffCount, locale)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('ad_tariff_stat_bump_packages')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatLocalizedNumber(data.autoBumpPackages.filter((p) => p.isActive).length, locale)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('ad_tariff_one_time_bump_price')}</CardTitle>
            <Coins className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{formatLocalizedCurrency(s.oneTimeBumpPriceToman, locale, t)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs dir={locale === "fa" ? 'rtl' : 'ltr'} defaultValue="settings" className="space-y-4">
        <TabsList  className="grid h-auto w-full grid-cols-1 gap-1 sm:grid-cols-3 sm:gap-0">
          <TabsTrigger value="settings">{t('ad_tariff_tab_settings')}</TabsTrigger>
          <TabsTrigger value="bump">{t('ad_tariff_tab_bump')}</TabsTrigger>
          <TabsTrigger value="matrix">{t('ad_tariff_tab_matrix')}</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <SettingsSection
            icon={Contact}
            title={t('ad_tariff_section_contact')}
            description={t('ad_tariff_section_contact_desc')}
          >
            {CONTACT_FIELDS.map(({ key, labelKey }) => (
              <NumberField
                key={key}
                id={key}
                label={t(labelKey)}
                value={s[key] as number}
                onChange={(value) => updateSetting(key, value)}
              />
            ))}
          </SettingsSection>

          <SettingsSection
            icon={Gift}
            title={t('ad_tariff_section_free')}
            description={t('ad_tariff_section_free_desc')}
          >
            {FREE_PLAN_FIELDS.map(({ key, labelKey }) => (
              <NumberField
                key={key}
                id={key}
                label={t(labelKey)}
                value={s[key] as number}
                onChange={(value) => updateSetting(key, value)}
              />
            ))}
          </SettingsSection>

          <SettingsSection icon={Zap} title={t('ad_tariff_section_xp')} description={t('ad_tariff_section_xp_desc')}>
            {XP_FIELDS.map(({ key, labelKey }) => (
              <NumberField
                key={key}
                id={key}
                label={t(labelKey)}
                value={s[key] as number}
                onChange={(value) => updateSetting(key, value)}
              />
            ))}
          </SettingsSection>

          <SettingsSection
            icon={TrendingUp}
            title={t('ad_tariff_section_bump')}
            description={t('ad_tariff_section_bump_desc')}
          >
            {BUMP_FIELDS.map(({ key, labelKey }) => (
              <NumberField
                key={key}
                id={key}
                label={t(labelKey)}
                value={s[key] as number}
                onChange={(value) => updateSetting(key, value)}
              />
            ))}
            <div className="flex items-center justify-between gap-4 rounded-xl border bg-muted/30 p-4 sm:col-span-2 lg:col-span-3">
              <div className="space-y-1">
                <Label className="text-sm font-medium">{t('ad_tariff_subscription_includes_auto_bump')}</Label>
                <p className="text-xs text-muted-foreground">{t('ad_tariff_subscription_includes_auto_bump_desc')}</p>
              </div>
              <Switch
                checked={s.subscriptionIncludesAutoBump}
                onCheckedChange={(checked) => updateSetting('subscriptionIncludesAutoBump', checked)}
              />
            </div>
          </SettingsSection>
        </TabsContent>

        <TabsContent value="bump">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {t('ad_tariff_bump_packages_title')}
                </CardTitle>
                <CardDescription>{t('ad_tariff_bump_packages_manage_desc')}</CardDescription>
              </div>
              <Button type="button" variant="outline" className="shrink-0 gap-2" onClick={addBumpPackage}>
                <Plus className="h-4 w-4" />
                {t('ad_tariff_add_bump_package')}
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.autoBumpPackages.length === 0 ? (
                <p className="text-sm text-muted-foreground md:col-span-2 xl:col-span-3">{t('ad_tariff_bump_packages_empty')}</p>
              ) : null}
              {data.autoBumpPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={cn(
                    'space-y-4 rounded-xl border p-4 transition-colors',
                    pkg.isActive ? 'border-border bg-card' : 'border-dashed bg-muted/20 opacity-75'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-semibold">{pkg.name || t('ad_tariff_package_unnamed')}</p>
                      <Badge variant={pkg.isActive ? 'success' : 'secondary'}>
                        {pkg.isActive ? t('status_active') : t('status_inactive')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {pkg.id.startsWith('new-') ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 text-destructive"
                          onClick={() => removeBumpPackage(pkg.id)}
                        >
                          {t('ad_tariff_remove_package')}
                        </Button>
                      ) : null}
                      <Switch
                        checked={pkg.isActive}
                        onCheckedChange={(checked) => updateBumpPackage(pkg.id, { isActive: checked })}
                      />
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>{t('ad_tariff_package_name')}</Label>
                      <Input
                        value={pkg.name}
                        onChange={(e) => updateBumpPackage(pkg.id, { name: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>{t('ad_tariff_package_duration_days')}</Label>
                        <Input
                          type="number"
                          value={pkg.durationDays}
                          onChange={(e) => updateBumpPackage(pkg.id, { durationDays: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('ad_tariff_package_price')}</Label>
                        <Input
                          type="number"
                          value={pkg.priceToman}
                          onChange={(e) => updateBumpPackage(pkg.id, { priceToman: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('ad_tariff_package_price_preview', {
                        price: formatLocalizedCurrency(pkg.priceToman, locale, t),
                        days: formatLocalizedNumber(pkg.durationDays, locale),
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matrix">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" />
                {t('ad_tariff_matrix_title')}
              </CardTitle>
              <CardDescription>{t('ad_tariff_matrix_manage_desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.tariffs.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
                  {t('ad_tariff_matrix_empty')}
                </div>
              ) : null}
              <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="min-w-[5rem] font-semibold">{t('ad_tariff_matrix_stars')}</TableHead>
                    {DURATIONS.map((months) => (
                      <TableHead key={months} className="min-w-[10rem] text-center font-semibold">
                        {t('ad_tariff_month_label', { months: formatLocalizedNumber(months, locale) })}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {STARS.map((star) => (
                    <TableRow key={star}>
                      <TableCell className="align-top font-medium">
                        <div className="flex items-center gap-1.5 pt-3">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span>{t('ad_tariff_star_label', { star: formatLocalizedNumber(star, locale) })}</span>
                        </div>
                      </TableCell>
                      {DURATIONS.map((months) => {
                        const row = tariffAt(months, star);
                        if (!row) {
                          return (
                            <TableCell key={months} className="align-top text-center text-muted-foreground">
                              —
                            </TableCell>
                          );
                        }
                        return (
                          <TableCell key={months} className="align-top">
                            <TariffCell
                              row={row}
                              locale={locale}
                              t={t}
                              onUpdate={(patch) => updateTariffField(row.id, patch)}
                            />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
