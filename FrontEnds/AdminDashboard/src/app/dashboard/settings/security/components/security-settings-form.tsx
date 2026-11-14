'use client';

import * as React from 'react';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import {
  getSecuritySettings,
  upsertSecuritySettings,
  type SecuritySettingsPayload,
} from '@/services/security-settings-api.service';

const DEFAULT_FORM: SecuritySettingsPayload = {
  maxLoginAttempts: 5,
  lockoutMinutes: 15,
  permanentBlockAfterLockouts: 2,
  ipUnblockOtpExpiryMinutes: 10,
  ipUnblockOtpResendCooldownSeconds: 120,
};

export function SecuritySettingsForm() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [form, setForm] = React.useState<SecuritySettingsPayload>(DEFAULT_FORM);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);
    void getSecuritySettings()
      .then((data) => setForm({ ...DEFAULT_FORM, ...data }))
      .catch(() => {
        toast({ variant: 'destructive', title: t('security_settings_load_failed') });
      })
      .finally(() => setLoading(false));
  }, [t, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await upsertSecuritySettings(form);
      toast({ title: t('security_settings_save_success') });
    } catch {
      toast({ variant: 'destructive', title: t('security_settings_save_failed') });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)}>
      <Card>
        <CardHeader>
          <CardTitle>{t('security_settings_title')}</CardTitle>
          <CardDescription>{t('security_settings_description')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="maxLoginAttempts">{t('security_settings_max_attempts')}</Label>
            <Input
              id="maxLoginAttempts"
              type="number"
              min={3}
              max={20}
              value={form.maxLoginAttempts}
              onChange={(e) => setForm((f) => ({ ...f, maxLoginAttempts: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lockoutMinutes">{t('security_settings_lockout_minutes')}</Label>
            <Input
              id="lockoutMinutes"
              type="number"
              min={5}
              max={1440}
              value={form.lockoutMinutes}
              onChange={(e) => setForm((f) => ({ ...f, lockoutMinutes: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="permanentBlockAfterLockouts">{t('security_settings_permanent_after')}</Label>
            <Input
              id="permanentBlockAfterLockouts"
              type="number"
              min={1}
              max={10}
              value={form.permanentBlockAfterLockouts}
              onChange={(e) => setForm((f) => ({ ...f, permanentBlockAfterLockouts: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ipUnblockOtpExpiryMinutes">{t('security_settings_otp_expiry')}</Label>
            <Input
              id="ipUnblockOtpExpiryMinutes"
              type="number"
              min={1}
              max={60}
              value={form.ipUnblockOtpExpiryMinutes}
              onChange={(e) => setForm((f) => ({ ...f, ipUnblockOtpExpiryMinutes: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="ipUnblockOtpResendCooldownSeconds">{t('security_settings_otp_cooldown')}</Label>
            <Input
              id="ipUnblockOtpResendCooldownSeconds"
              type="number"
              min={30}
              max={600}
              value={form.ipUnblockOtpResendCooldownSeconds}
              onChange={(e) => setForm((f) => ({ ...f, ipUnblockOtpResendCooldownSeconds: Number(e.target.value) }))}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
            {t('actions_save')}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
