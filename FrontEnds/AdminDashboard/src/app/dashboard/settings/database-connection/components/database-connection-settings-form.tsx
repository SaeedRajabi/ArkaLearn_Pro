'use client';

import * as React from 'react';
import { Database, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import { SettingsFormError, SettingsFormLoading } from '@/components/settings/settings-form-states';
import {
  getDatabaseConnectionSettings,
  upsertDatabaseConnectionSettings,
  type DatabaseConnectionSettingsPayload,
} from '@/services/database-connection-settings-api.service';

export function DatabaseConnectionSettingsForm() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<DatabaseConnectionSettingsPayload | null>(null);

  const loadSettings = React.useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getDatabaseConnectionSettings();
      setForm(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('db_connection_settings_load_failed');
      setLoadError(message);
      setForm(null);
    } finally {
      setLoading(false);
    }
  }, [t]);

  React.useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const update = <K extends keyof DatabaseConnectionSettingsPayload>(
    key: K,
    value: DatabaseConnectionSettingsPayload[K],
  ) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    try {
      await upsertDatabaseConnectionSettings(form);
      const refreshed = await getDatabaseConnectionSettings();
      setForm(refreshed);
      toast({ title: t('db_connection_settings_save_success') });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('db_connection_settings_save_failed'),
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SettingsFormLoading
        title={t('db_connection_settings_title')}
        description={t('db_connection_settings_description')}
      />
    );
  }

  if (loadError || !form) {
    return (
      <SettingsFormError
        title={t('db_connection_settings_load_failed')}
        message={loadError ?? t('db_connection_settings_load_failed')}
        onRetry={() => void loadSettings()}
        retrying={loading}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          {t('db_connection_settings_title')}
        </CardTitle>
        <CardDescription>{t('db_connection_settings_description')}</CardDescription>
      </CardHeader>
      <CardContent className="grid max-w-2xl gap-4">
        <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
          {t('db_connection_bootstrap_hint')}
        </div>

        <div className="flex items-center justify-between gap-4 rounded-md border p-3">
          <div>
            <Label>{t('db_connection_use_database')}</Label>
            <p className="text-sm text-muted-foreground">{t('db_connection_use_database_desc')}</p>
          </div>
          <Switch
            checked={form.useDatabaseConnection}
            onCheckedChange={(v) => update('useDatabaseConnection', v)}
          />
        </div>

        {form.useDatabaseConnection ? (
          <div className="grid gap-3 rounded-md border p-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>{t('db_connection_server')}</Label>
                <Input value={form.server} onChange={(e) => update('server', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{t('db_connection_port')}</Label>
                <Input
                  type="number"
                  value={form.port ?? ''}
                  onChange={(e) => update('port', e.target.value ? Number(e.target.value) : null)}
                  placeholder="1433"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>{t('db_connection_database')}</Label>
              <Input value={form.database} onChange={(e) => update('database', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t('db_connection_user')}</Label>
              <Input value={form.userId} onChange={(e) => update('userId', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t('db_connection_password')}</Label>
              <Input
                type="password"
                value={form.password ?? ''}
                onChange={(e) => update('password', e.target.value)}
                placeholder={form.hasPassword ? t('cache_keep_existing_password') : ''}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label>{t('db_connection_trust_certificate')}</Label>
              <Switch
                checked={form.trustServerCertificate}
                onCheckedChange={(v) => update('trustServerCertificate', v)}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label>{t('db_connection_multiple_active_sets')}</Label>
              <Switch
                checked={form.multipleActiveResultSets}
                onCheckedChange={(v) => update('multipleActiveResultSets', v)}
              />
            </div>
          </div>
        ) : null}

        <Button onClick={() => void handleSave()} disabled={saving}>
          {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
          {t('db_connection_settings_save')}
        </Button>
      </CardContent>
    </Card>
  );
}
