'use client';

import * as React from 'react';
import { Loader2, RefreshCw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import { SettingsFormError, SettingsFormLoading } from '@/components/settings/settings-form-states';
import {
  getCacheSettings,
  getCacheWarmupStatus,
  startCacheWarmup,
  upsertCacheSettings,
  type CacheProvider,
  type CacheSettingsPayload,
  type CacheWarmupProgress,
} from '@/services/cache-settings-api.service';

const REGION_KEYS: Array<{ key: keyof CacheSettingsPayload; labelKey: string }> = [
  { key: 'cacheCoursesEnabled', labelKey: 'cache_region_courses' },
  { key: 'cacheArticlesEnabled', labelKey: 'cache_region_articles' },
  { key: 'cacheSeminarsEnabled', labelKey: 'cache_region_seminars' },
  { key: 'cacheBooksEnabled', labelKey: 'cache_region_books' },
  { key: 'cacheSoftwareEnabled', labelKey: 'cache_region_software' },
  { key: 'cacheTeacherAdsEnabled', labelKey: 'cache_region_teacher_ads' },
  { key: 'cacheFilesEnabled', labelKey: 'cache_region_files' },
  { key: 'cacheCategoriesEnabled', labelKey: 'cache_region_categories' },
  { key: 'cacheTeachersEnabled', labelKey: 'cache_region_teachers' },
  { key: 'cacheProjectsEnabled', labelKey: 'cache_region_projects' },
];

function translateWarmupStep(
  step: string | null | undefined,
  t: (key: string, params?: Record<string, string | number>) => string
): string {
  if (!step) return t('cache_warmup_title');
  if (step.startsWith('cache_warmup_step_media_check:')) {
    const parts = step.split(':');
    const done = parts[1] ?? '0';
    const total = parts[2] ?? '0';
    return t('cache_warmup_step_media_check_progress', { done, total });
  }
  if (step.startsWith('cache_warmup_step_images:')) {
    const parts = step.split(':');
    const done = parts[1] ?? '0';
    const total = parts[2] ?? '0';
    return t('cache_warmup_step_images_progress', { done, total });
  }
  const translated = t(step);
  return translated === step ? step : translated;
}

export function CacheSettingsForm() {
  const { t , locale } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [warming, setWarming] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<CacheSettingsPayload | null>(null);
  const [warmup, setWarmup] = React.useState<CacheWarmupProgress | null>(null);
  const pollTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollSeqRef = React.useRef(0);

  const stopPolling = React.useCallback(() => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }, []);

  const loadSettings = React.useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getCacheSettings();
      setForm(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('cache_settings_load_failed');
      setLoadError(message);
      setForm(null);
    } finally {
      setLoading(false);
    }
  }, [t]);

  React.useEffect(() => {
    void loadSettings();
    return () => stopPolling();
  }, [loadSettings, stopPolling]);

  const update = <K extends keyof CacheSettingsPayload>(key: K, value: CacheSettingsPayload[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const toSave = { ...form, isEnabled: form.isEnabled === true };
      const saved = await upsertCacheSettings(toSave);
      // Trust the value the admin just saved (prevents UI snap-back if GET/unwrap misreads).
      setForm({ ...saved, isEnabled: toSave.isEnabled });
      toast({
        title: t('cache_settings_save_success'),
        description: toSave.isEnabled
          ? t('cache_settings_enabled_on_hint')
          : t('cache_settings_enabled_off_hint'),
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('cache_settings_save_failed'),
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  const pollWarmupStatus = React.useCallback(
    (jobId: string, seq: number) => {
      stopPolling();
      pollTimeoutRef.current = setTimeout(() => {
        void (async () => {
          if (seq !== pollSeqRef.current) return;
          try {
            const status = await getCacheWarmupStatus(jobId);
            if (seq !== pollSeqRef.current) return;

            setWarmup((prev) => {
              // Never overwrite a terminal state with a stale Running response.
              if (
                prev &&
                (prev.status === 'Completed' || prev.status === 'Failed') &&
                status.status === 'Running'
              ) {
                return prev;
              }
              return status;
            });

            if (status.status === 'Completed' || status.status === 'Failed') {
              setWarming(false);
              toast({
                variant: status.status === 'Failed' ? 'destructive' : 'default',
                title:
                  status.status === 'Failed'
                    ? t('cache_warmup_failed')
                    : t('cache_warmup_success'),
                description: status.error || translateWarmupStep(status.currentStep, t),
              });
              return;
            }

            pollWarmupStatus(jobId, seq);
          } catch (err) {
            if (seq !== pollSeqRef.current) return;
            setWarming(false);
            toast({
              variant: 'destructive',
              title: t('cache_warmup_failed'),
              description: err instanceof Error ? err.message : undefined,
            });
          }
        })();
      }, 900);
    },
    [stopPolling, t, toast]
  );

  const handleWarmup = async () => {
    if (!form?.isEnabled) {
      toast({
        variant: 'destructive',
        title: t('cache_warmup_requires_enabled'),
      });
      return;
    }

    setWarming(true);
    try {
      const started = await startCacheWarmup();
      setWarmup(started);
      stopPolling();
      const seq = ++pollSeqRef.current;
      pollWarmupStatus(started.jobId, seq);
    } catch (err) {
      setWarming(false);
      toast({
        variant: 'destructive',
        title: t('cache_warmup_failed'),
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  if (loading) {
    return (
      <SettingsFormLoading
        title={t('cache_settings_title')}
        description={t('cache_settings_description')}
      />
    );
  }

  if (loadError || !form) {
    return (
      <SettingsFormError
        title={t('cache_settings_load_failed')}
        message={loadError ?? t('cache_settings_load_failed')}
        onRetry={() => void loadSettings()}
        retrying={loading}
      />
    );
  }

  const warmupRunning = warming || warmup?.status === 'Running';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('cache_settings_title')}</CardTitle>
        <CardDescription>{t('cache_settings_description')}</CardDescription>
      </CardHeader>
      <CardContent className="grid max-w-2xl gap-4">
        <div className="flex items-center justify-between gap-4 rounded-md border p-3">
          <div>
            <Label>{t('cache_settings_enabled')}</Label>
            <p className="text-sm text-muted-foreground">{t('cache_settings_enabled_desc')}</p>
          </div>
          <Switch checked={form.isEnabled === true} onCheckedChange={(v) => update('isEnabled', v)} />
        </div>

        <div className="space-y-1">
          <Label>{t('cache_settings_provider')}</Label>
          <Select value={form.provider} onValueChange={(v) => update('provider', v as CacheProvider)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="InMemory">{t('cache_provider_inmemory')}</SelectItem>
              <SelectItem value="Redis">{t('cache_provider_redis')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>{t('cache_settings_ttl')}</Label>
          <Input
            type="number"
            min={1}
            max={1440}
            value={form.defaultTtlMinutes}
            onChange={(e) => update('defaultTtlMinutes', Number(e.target.value) || 30)}
          />
          <p className="text-sm text-muted-foreground">{t('cache_settings_ttl_desc')}</p>
        </div>

        {form.provider === 'Redis' ? (
          <div className="grid gap-3 rounded-md border p-4">
            <h3 className="font-medium">{t('cache_redis_connection_title')}</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>{t('cache_redis_host')}</Label>
                <Input value={form.redisHost} onChange={(e) => update('redisHost', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{t('cache_redis_port')}</Label>
                <Input
                  type="number"
                  value={form.redisPort}
                  onChange={(e) => update('redisPort', Number(e.target.value) || 6379)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>{t('cache_redis_password')}</Label>
              <Input
                type="password"
                value={form.redisPassword ?? ''}
                onChange={(e) => update('redisPassword', e.target.value)}
                placeholder={form.hasRedisPassword ? t('cache_keep_existing_password') : ''}
              />
            </div>
            <div className="space-y-1">
              <Label>{t('cache_redis_instance_name')}</Label>
              <Input
                value={form.redisInstanceName}
                onChange={(e) => update('redisInstanceName', e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label>{t('cache_redis_use_ssl')}</Label>
              <Switch dir={locale === "fa" ? "ltr" : "rtl"} checked={form.redisUseSsl} onCheckedChange={(v) => update('redisUseSsl', v)} />
            </div>
          </div>
        ) : null}

        <div className="grid gap-2 rounded-md border p-4">
          <h3 className="font-medium">{t('cache_regions_title')}</h3>
          {REGION_KEYS.map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-4">
              <Label>{t(item.labelKey)}</Label>
              <Switch
                  dir={locale === "fa" ? "ltr" : "rtl"}
                checked={Boolean(form[item.key])}
                onCheckedChange={(v) => update(item.key, v as CacheSettingsPayload[typeof item.key])}
              />
            </div>
          ))}
        </div>

        <div className="grid gap-3 rounded-md border p-4">
          <div>
            <h3 className="font-medium">{t('cache_warmup_title')}</h3>
            <p className="text-sm text-muted-foreground">{t('cache_warmup_desc')}</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void handleWarmup()}
            disabled={warmupRunning || !form.isEnabled || saving}
          >
            {warmupRunning ? (
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="me-2 h-4 w-4" />
            )}
            {t('cache_warmup_start')}
          </Button>
          {warmup ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-muted-foreground">{translateWarmupStep(warmup.currentStep, t)}</span>
                <span className="font-medium tabular-nums">{warmup.percent}%</span>
              </div>
              <Progress value={warmup.percent} />
              {warmup.error ? (
                <p className="text-sm text-destructive">{warmup.error}</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <Button onClick={() => void handleSave()} disabled={saving || warmupRunning}>
          {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
          {t('cache_settings_save')}
        </Button>
      </CardContent>
    </Card>
  );
}
