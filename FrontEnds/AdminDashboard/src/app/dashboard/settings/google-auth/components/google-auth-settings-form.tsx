'use client';

import * as React from 'react';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import {
  getGoogleAuthSettings,
  upsertGoogleAuthSettings,
  type GoogleAuthSettingsPayload,
} from '@/services/google-auth-settings-api.service';

const DEFAULT_FORM: GoogleAuthSettingsPayload = {
  isEnabled: true,
  clientId: '',
  clientSecret: '',
};

export function GoogleAuthSettingsForm() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [form, setForm] = React.useState<GoogleAuthSettingsPayload>(DEFAULT_FORM);
  const [hasClientSecret, setHasClientSecret] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const loadSettings = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getGoogleAuthSettings();
      setHasClientSecret(Boolean(data.hasClientSecret));
      setForm({
        isEnabled: data.isEnabled ?? true,
        clientId: data.clientId ?? '',
        clientSecret: '',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t('google_auth_settings_load_failed'),
      });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  React.useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      await upsertGoogleAuthSettings(form);
      toast({
        title: t('toast_settings_saved_title'),
        description: t('google_auth_settings_save_success'),
      });
      await loadSettings();
    } catch {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t('google_auth_settings_save_failed'),
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex min-h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{t('google_auth_settings_title')}</CardTitle>
          <CardDescription>{t('google_auth_settings_description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div className="space-y-1">
              <Label htmlFor="google-auth-enabled">{t('google_auth_settings_enabled')}</Label>
              <p className="text-sm text-muted-foreground">{t('google_auth_settings_enabled_hint')}</p>
            </div>
            <Switch
              id="google-auth-enabled"
              checked={form.isEnabled}
              onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isEnabled: checked }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="google-client-id">{t('google_auth_settings_client_id')}</Label>
            <Input
              id="google-client-id"
              value={form.clientId}
              onChange={(e) => setForm((prev) => ({ ...prev, clientId: e.target.value }))}
              placeholder="xxxx.apps.googleusercontent.com"
              autoComplete="off"
              dir="ltr"
              required={form.isEnabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="google-client-secret">
              {t('google_auth_settings_client_secret')}
              {hasClientSecret ? (
                <span className="ms-2 text-xs font-normal text-muted-foreground">
                  ({t('google_auth_settings_secret_saved')})
                </span>
              ) : null}
            </Label>
            <Input
              id="google-client-secret"
              type="password"
              value={form.clientSecret ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, clientSecret: e.target.value }))}
              placeholder={t('google_auth_settings_secret_keep')}
              autoComplete="new-password"
              dir="ltr"
            />
            <p className="text-sm text-muted-foreground">{t('google_auth_settings_secret_keep')}</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
            {t('google_auth_settings_save')}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
