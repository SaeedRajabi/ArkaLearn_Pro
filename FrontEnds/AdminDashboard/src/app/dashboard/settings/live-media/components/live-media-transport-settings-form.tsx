'use client';

import * as React from 'react';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import { resolveUserFacingError } from '@/lib/errors/user-facing-message';
import {
  getLiveMediaTransportSettings,
  upsertLiveMediaTransportSettings,
  type LiveMediaTransportMode,
  type LiveMediaTransportSettingsPayload,
} from '@/services/live-media-transport-settings-api.service';

const DEFAULT_FORM: LiveMediaTransportSettingsPayload = {
  transportMode: 'Mesh',
  liveKitUrl: '',
  liveKitApiKey: '',
  liveKitApiSecret: '',
  hasLiveKitApiSecret: false,
  turnUrl: '',
  turnUsername: '',
  hasTurnPassword: false,
  turnPassword: undefined,
  stunUrls: '',
};

/**
 * فرم انتخاب Mesh/SFU و اعتبارنامه‌های رسانه. دریافت مجدد پس از ذخیره، مقادیر نرمال‌شده سرور را نشان می‌دهد.
 * پیام ذخیره موفق فقط ثبت تنظیمات را تأیید می‌کند؛ این فرم تست WebSocket، ICE یا relay انجام نمی‌دهد.
 */
export function LiveMediaTransportSettingsForm() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [form, setForm] = React.useState<LiveMediaTransportSettingsPayload>(DEFAULT_FORM);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);
    void getLiveMediaTransportSettings()
      .then((data) => setForm({ ...DEFAULT_FORM, ...data, liveKitApiSecret: '', turnPassword: undefined }))
      .catch(() => {
        toast({ variant: 'destructive', title: t('live_media_settings_load_failed') });
      })
      .finally(() => setLoading(false));
  }, [t, toast]);

  /** ذخیره تنظیمات و تازه‌سازی وضعیت وجود رمزها، بدون نمایش مجدد متن رمز در ورودی‌ها. */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await upsertLiveMediaTransportSettings(form);
      toast({ title: t('live_media_settings_save_success') });
      const refreshed = await getLiveMediaTransportSettings();
      setForm({ ...DEFAULT_FORM, ...refreshed, liveKitApiSecret: '', turnPassword: undefined });
    } catch (error) {
      toast({ variant: 'destructive', title: t('live_media_settings_save_failed'), description: resolveUserFacingError(error) });
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

  const isLiveKit = form.transportMode === 'LiveKit';

  return (
    <form onSubmit={(e) => void handleSubmit(e)}>
      <Card>
        <CardHeader>
          <CardTitle>{t('live_media_settings_title')}</CardTitle>
          <CardDescription>{t('live_media_settings_description')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="transportMode">{t('live_media_settings_mode')}</Label>
            <Select
              value={form.transportMode}
              onValueChange={(value) =>
                setForm((f) => ({
                  ...f,
                  transportMode: value as LiveMediaTransportMode,
                }))
              }
            >
              <SelectTrigger id="transportMode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mesh">{t('live_media_settings_mode_mesh')}</SelectItem>
                <SelectItem value="LiveKit">{t('live_media_settings_mode_livekit')}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{t('live_media_settings_mode_hint')}</p>
          </div>

          {isLiveKit && (
            <>
              <div className="space-y-2">
                <Label htmlFor="liveKitUrl">{t('live_media_settings_url')}</Label>
                <Input
                  id="liveKitUrl"
                  value={form.liveKitUrl}
                  placeholder="wss://livekit.example.com"
                  onChange={(e) => setForm((f) => ({ ...f, liveKitUrl: e.target.value }))}
                  required
                />
                <p className="text-xs text-muted-foreground">{t('live_media_settings_url_hint')}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="liveKitApiKey">{t('live_media_settings_api_key')}</Label>
                <Input
                  id="liveKitApiKey"
                  value={form.liveKitApiKey}
                  onChange={(e) => setForm((f) => ({ ...f, liveKitApiKey: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="liveKitApiSecret">{t('live_media_settings_api_secret')}</Label>
                <Input
                  id="liveKitApiSecret"
                  type="password"
                  autoComplete="new-password"
                  value={form.liveKitApiSecret}
                  placeholder={
                    form.hasLiveKitApiSecret
                      ? t('live_media_settings_secret_keep')
                      : undefined
                  }
                  onChange={(e) => setForm((f) => ({ ...f, liveKitApiSecret: e.target.value }))}
                />
                {form.hasLiveKitApiSecret && (
                  <p className="text-xs text-muted-foreground">
                    {t('live_media_settings_secret_saved')}
                  </p>
                )}
              </div>
            </>
          )}

          <div className="space-y-2 rounded-lg border border-dashed p-3 sm:col-span-2">
            <p className="text-sm font-medium">{t('live_media_settings_turn_title')}</p>
            <p className="text-xs text-muted-foreground">{t('live_media_settings_turn_hint')}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="turnUrl">{t('live_media_settings_turn_url')}</Label>
                <Input
                  id="turnUrl"
                  value={form.turnUrl}
                  placeholder="turn:turn.example.com:3478,turns:turn.example.com:5349"
                  dir="ltr"
                  onChange={(e) => setForm((f) => ({ ...f, turnUrl: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="turnUsername">{t('live_media_settings_turn_username')}</Label>
                <Input
                  id="turnUsername"
                  value={form.turnUsername}
                  dir="ltr"
                  onChange={(e) => setForm((f) => ({ ...f, turnUsername: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="turnPassword">{t('live_media_settings_turn_password')}</Label>
                <Input
                  id="turnPassword"
                  type="password"
                  autoComplete="new-password"
                  value={form.turnPassword ?? ''}
                  placeholder={form.hasTurnPassword ? t('live_media_settings_secret_keep') : undefined}
                  onChange={(e) => setForm((f) => ({ ...f, turnPassword: e.target.value }))}
                />
                {form.hasTurnPassword && (
                  <p className="text-xs text-muted-foreground">{t('live_media_settings_secret_saved')}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="stunUrls">{t('live_media_settings_stun_urls')}</Label>
                <Input
                  id="stunUrls"
                  value={form.stunUrls}
                  placeholder="stun:stun.l.google.com:19302"
                  dir="ltr"
                  onChange={(e) => setForm((f) => ({ ...f, stunUrls: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {t('live_media_settings_save')}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
