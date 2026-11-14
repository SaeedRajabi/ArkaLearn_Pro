'use client';

import * as React from 'react';
import { Loader2, Mail, Save, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import {
  getEmailSettings,
  testEmailDelivery,
  upsertEmailSettings,
  type EmailSettingsPayload,
} from '@/services/email-settings-api.service';

const DEFAULT_FORM: EmailSettingsPayload = {
  isEnabled: true,
  host: 'mail.arkasoftware.ir',
  port: 465,
  useSsl: true,
  useStartTls: false,
  allowInvalidCertificate: true,
  username: '',
  password: '',
  fromEmail: '',
  fromName: 'ArkaSoftware',
  timeoutSeconds: 30,
  requireEmailVerification: true,
  otpExpiryMinutes: 10,
  otpResendCooldownSeconds: 120,
  passwordResetLinkExpiryMinutes: 15,
  passwordChangeUseSms: false,
};

export function EmailSettingsForm() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [form, setForm] = React.useState<EmailSettingsPayload>(DEFAULT_FORM);
  const [hasPassword, setHasPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [testEmail, setTestEmail] = React.useState('');

  const loadSettings = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEmailSettings();
      setHasPassword(Boolean(data.hasPassword));
      setForm({
        ...DEFAULT_FORM,
        ...data,
        password: '',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t('email_settings_load_failed'),
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
      await upsertEmailSettings(form);
      toast({
        title: t('toast_settings_saved_title'),
        description: t('email_settings_save_success'),
      });
      await loadSettings();
    } catch {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t('email_settings_save_failed'),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testEmail.trim()) return;
    setTesting(true);
    try {
      await testEmailDelivery(testEmail.trim());
      toast({ title: t('email_settings_test_success') });
    } catch {
      toast({
        variant: 'destructive',
        title: t('email_settings_test_failed'),
      });
    } finally {
      setTesting(false);
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          {t('email_settings_title')}
        </CardTitle>
        <CardDescription>{t('email_settings_description')}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
            <Label htmlFor="email-enabled">{t('email_settings_enabled')}</Label>
            <Switch
              id="email-enabled"
              checked={form.isEnabled}
              onCheckedChange={(v) => setForm((p) => ({ ...p, isEnabled: v }))}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="smtp-host">{t('email_settings_host')}</Label>
              <Input
                id="smtp-host"
                value={form.host}
                onChange={(e) => setForm((p) => ({ ...p, host: e.target.value }))}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-port">{t('email_settings_port')}</Label>
              <Input
                id="smtp-port"
                type="number"
                value={form.port}
                onChange={(e) => setForm((p) => ({ ...p, port: Number(e.target.value) || 587 }))}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-username">{t('email_settings_username')}</Label>
              <Input
                id="smtp-username"
                value={form.username}
                onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-password">
                {t('email_settings_password')}
                {hasPassword ? ` (${t('email_settings_password_saved')})` : ''}
              </Label>
              <Input
                id="smtp-password"
                type="password"
                value={form.password ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder={hasPassword ? t('email_settings_password_keep') : ''}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="from-email">{t('email_settings_from_email')}</Label>
              <Input
                id="from-email"
                type="email"
                value={form.fromEmail}
                onChange={(e) => setForm((p) => ({ ...p, fromEmail: e.target.value }))}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="from-name">{t('email_settings_from_name')}</Label>
              <Input
                id="from-name"
                value={form.fromName}
                onChange={(e) => setForm((p) => ({ ...p, fromName: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <ToggleRow
              label={t('email_settings_use_ssl')}
              checked={form.useSsl}
              onCheckedChange={(v) => setForm((p) => ({ ...p, useSsl: v }))}
            />
            <ToggleRow
              label={t('email_settings_use_starttls')}
              checked={form.useStartTls}
              onCheckedChange={(v) => setForm((p) => ({ ...p, useStartTls: v }))}
            />
            <ToggleRow
              label={t('email_settings_allow_invalid_cert')}
              checked={form.allowInvalidCertificate}
              onCheckedChange={(v) => setForm((p) => ({ ...p, allowInvalidCertificate: v }))}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
            <div>
              <Label htmlFor="require-verify">{t('email_settings_require_verification')}</Label>
              <p className="text-xs text-muted-foreground">{t('email_settings_require_verification_hint')}</p>
            </div>
            <Switch
              id="require-verify"
              checked={form.requireEmailVerification}
              onCheckedChange={(v) => setForm((p) => ({ ...p, requireEmailVerification: v }))}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="otp-expiry">{t('email_settings_otp_expiry')}</Label>
              <Input
                id="otp-expiry"
                type="number"
                value={form.otpExpiryMinutes}
                onChange={(e) => setForm((p) => ({ ...p, otpExpiryMinutes: Number(e.target.value) || 10 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="otp-cooldown">{t('email_settings_otp_cooldown')}</Label>
              <Input
                id="otp-cooldown"
                type="number"
                value={form.otpResendCooldownSeconds}
                onChange={(e) =>
                  setForm((p) => ({ ...p, otpResendCooldownSeconds: Number(e.target.value) || 120 }))
                }
              />
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-4">
            <div>
              <h3 className="font-medium">{t('email_settings_password_reset_title')}</h3>
              <p className="text-xs text-muted-foreground">{t('email_settings_password_reset_hint')}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="reset-expiry">{t('email_settings_reset_link_expiry')}</Label>
                <Input
                  id="reset-expiry"
                  type="number"
                  value={form.passwordResetLinkExpiryMinutes}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      passwordResetLinkExpiryMinutes: Number(e.target.value) || 15,
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
              <div>
                <Label htmlFor="password-sms">{t('email_settings_password_change_sms')}</Label>
                <p className="text-xs text-muted-foreground">{t('email_settings_password_change_sms_hint')}</p>
              </div>
              <Switch
                id="password-sms"
                checked={form.passwordChangeUseSms}
                onCheckedChange={(v) => setForm((p) => ({ ...p, passwordChangeUseSms: v }))}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="test-email">{t('email_settings_test_to')}</Label>
              <Input
                id="test-email"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="admin@example.com"
                dir="ltr"
              />
            </div>
            <Button type="button" variant="outline" disabled={testing || !testEmail.trim()} onClick={() => void handleTest()}>
              {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {t('email_settings_test_button')}
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {t('email_settings_save')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function ToggleRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
      <Label className="text-sm font-normal">{label}</Label>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
