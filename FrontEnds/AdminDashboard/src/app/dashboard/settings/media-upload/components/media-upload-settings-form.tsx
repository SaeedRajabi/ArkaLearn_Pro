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
  getMediaUploadSettings,
  upsertMediaUploadSettings,
  type MediaUploadSettingsPayload,
} from '@/services/media-upload-settings-api.service';

const DEFAULT_FORM: MediaUploadSettingsPayload = {
  courseIntroMaxDurationMinutes: 5,
  promotionalVideoMaxDurationMinutes: 5,
};

export function MediaUploadSettingsForm() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [form, setForm] = React.useState<MediaUploadSettingsPayload>(DEFAULT_FORM);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);
    void getMediaUploadSettings()
      .then((data) => setForm({ ...DEFAULT_FORM, ...data }))
      .catch(() => {
        toast({ variant: 'destructive', title: t('media_upload_settings_load_failed') });
      })
      .finally(() => setLoading(false));
  }, [t, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await upsertMediaUploadSettings(form);
      toast({ title: t('media_upload_settings_save_success') });
    } catch {
      toast({ variant: 'destructive', title: t('media_upload_settings_save_failed') });
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
          <CardTitle>{t('media_upload_settings_title')}</CardTitle>
          <CardDescription>{t('media_upload_settings_description')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="courseIntroMaxDurationMinutes">{t('media_upload_settings_course_intro')}</Label>
            <Input
              id="courseIntroMaxDurationMinutes"
              type="number"
              min={1}
              max={120}
              value={form.courseIntroMaxDurationMinutes}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  courseIntroMaxDurationMinutes: Number(e.target.value),
                }))
              }
            />
            <p className="text-xs text-muted-foreground">{t('media_upload_settings_course_intro_hint')}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="promotionalVideoMaxDurationMinutes">{t('media_upload_settings_promo')}</Label>
            <Input
              id="promotionalVideoMaxDurationMinutes"
              type="number"
              min={1}
              max={120}
              value={form.promotionalVideoMaxDurationMinutes}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  promotionalVideoMaxDurationMinutes: Number(e.target.value),
                }))
              }
            />
            <p className="text-xs text-muted-foreground">{t('media_upload_settings_promo_hint')}</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {t('media_upload_settings_save')}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
