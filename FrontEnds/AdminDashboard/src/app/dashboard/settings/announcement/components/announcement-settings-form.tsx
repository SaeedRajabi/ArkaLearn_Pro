'use client';

import * as React from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/components/language-provider';
import { CustomRichTextEditor } from '@/components/ui/custom-rich-text-editor';
import { ColorPicker } from '@/components/ui/color-picker';
import { BannerBackgroundCropDialog } from '@/components/ui/banner-background-crop-dialog';
import {
  DEFAULT_SITE_ANNOUNCEMENT_SETTINGS,
  getSiteAnnouncementSettings,
  upsertSiteAnnouncementSettings,
  type SiteAnnouncementBackgroundType,
  type UpsertSiteAnnouncementPayload,
} from '@/services/site-announcement-api.service';
import { validateBannerImageFile } from '@/lib/utils/banner-background-crop';
import apiClient from '@/lib/apiClient';

function resolvePreviewImageUrl(path: string): string {
  if (!path?.trim()) return '';
  if (/^(data:|blob:|https?:\/\/)/i.test(path)) return path;
  const base = apiClient.defaults.baseURL?.replace(/\/api\/service\/?$/i, '') ?? '';
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${normalized}` : normalized;
}

function buildBackgroundStyle(form: UpsertSiteAnnouncementPayload, previewImageUrl: string): React.CSSProperties {
  if (form.backgroundType === 1) {
    return {
      background: `linear-gradient(${form.gradientAngle}deg, ${form.gradientStartColor}, ${form.gradientEndColor})`,
    };
  }
  if (form.backgroundType === 2 && previewImageUrl) {
    return {
      backgroundImage: `url("${previewImageUrl}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  return { backgroundColor: form.backgroundColor };
}

export function AnnouncementSettingsForm() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [form, setForm] = React.useState<UpsertSiteAnnouncementPayload>(DEFAULT_SITE_ANNOUNCEMENT_SETTINGS);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [cropDialogOpen, setCropDialogOpen] = React.useState(false);
  const [pendingCropSrc, setPendingCropSrc] = React.useState('');
  const [localPreviewUrl, setLocalPreviewUrl] = React.useState('');

  const loadSettings = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSiteAnnouncementSettings();
      setForm(data ? { ...DEFAULT_SITE_ANNOUNCEMENT_SETTINGS, ...data } : DEFAULT_SITE_ANNOUNCEMENT_SETTINGS);
      setLocalPreviewUrl('');
    } catch {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t('site_announcement_load_failed'),
      });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  React.useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const previewImageUrl =
    localPreviewUrl ||
    (form.backgroundImageFile ? URL.createObjectURL(form.backgroundImageFile) : '') ||
    resolvePreviewImageUrl(form.backgroundImageUrl);

  React.useEffect(() => {
    return () => {
      if (localPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(localPreviewUrl);
    };
  }, [localPreviewUrl]);

  const handleBackgroundTypeChange = (value: string) => {
    setForm((prev) => ({ ...prev, backgroundType: Number(value) as SiteAnnouncementBackgroundType }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const validationError = validateBannerImageFile(file);
    if (validationError) {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t(`site_announcement_image_${validationError}`),
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPendingCropSrc(reader.result as string);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCroppedImage = (file: File) => {
    if (localPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(localPreviewUrl);
    const objectUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(objectUrl);
    setForm((prev) => ({
      ...prev,
      backgroundType: 2,
      backgroundImageFile: file,
      clearBackgroundImage: false,
    }));
  };

  const handleRemoveBackgroundImage = () => {
    if (localPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(localPreviewUrl);
    setLocalPreviewUrl('');
    setForm((prev) => ({
      ...prev,
      backgroundImageFile: null,
      backgroundImageUrl: '',
      clearBackgroundImage: true,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      await upsertSiteAnnouncementSettings(form);
      toast({
        title: t('toast_settings_saved_title'),
        description: t('site_announcement_save_success'),
      });
      await loadSettings();
    } catch {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t('site_announcement_save_failed'),
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

  const previewStyle = buildBackgroundStyle(form, previewImageUrl);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('site_announcement_settings_title')}</CardTitle>
          <CardDescription>{t('site_announcement_settings_description')}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-8">
            <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
              <div className="space-y-1">
                <Label htmlFor="announcement-enabled">{t('site_announcement_enabled_label')}</Label>
                <p className="text-sm text-muted-foreground">{t('site_announcement_enabled_hint')}</p>
              </div>
              <Switch
                id="announcement-enabled"
                checked={form.isEnabled}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isEnabled: checked }))}
              />
            </div>

            <section className="space-y-3">
              <Label>{t('site_announcement_content_label')}</Label>
              <p className="text-sm text-muted-foreground">{t('site_announcement_content_hint')}</p>
              <CustomRichTextEditor
                content={form.contentHtml}
                onChangeAction={(html) => setForm((prev) => ({ ...prev, contentHtml: html }))}
              />
            </section>

            <section className="space-y-4">
              <Label>{t('site_announcement_appearance_label')}</Label>

              <div className="flex items-center gap-3">
                <Label className="min-w-24">{t('site_announcement_text_color')}</Label>
                <ColorPicker
                  color={form.textColor}
                  onChangeAction={(color) => setForm((prev) => ({ ...prev, textColor: color }))}
                />
                <Input
                  value={form.textColor}
                  onChange={(e) => setForm((prev) => ({ ...prev, textColor: e.target.value }))}
                  className="max-w-[8rem] font-mono text-sm"
                />
              </div>

              <Tabs value={String(form.backgroundType)} onValueChange={handleBackgroundTypeChange}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="0">{t('site_announcement_bg_solid')}</TabsTrigger>
                  <TabsTrigger value="1">{t('site_announcement_bg_gradient')}</TabsTrigger>
                  <TabsTrigger value="2">{t('site_announcement_bg_image')}</TabsTrigger>
                </TabsList>

                <TabsContent value="0" className="space-y-3 pt-4">
                  <div className="flex items-center gap-3">
                    <Label>{t('site_announcement_bg_color')}</Label>
                    <ColorPicker
                      color={form.backgroundColor}
                      onChangeAction={(color) => setForm((prev) => ({ ...prev, backgroundColor: color }))}
                    />
                    <Input
                      value={form.backgroundColor}
                      onChange={(e) => setForm((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                      className="max-w-[8rem] font-mono text-sm"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="1" className="space-y-4 pt-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Label>{t('site_announcement_gradient_start')}</Label>
                    <ColorPicker
                      color={form.gradientStartColor}
                      onChangeAction={(color) => setForm((prev) => ({ ...prev, gradientStartColor: color }))}
                    />
                    <Label>{t('site_announcement_gradient_end')}</Label>
                    <ColorPicker
                      color={form.gradientEndColor}
                      onChangeAction={(color) => setForm((prev) => ({ ...prev, gradientEndColor: color }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      {t('site_announcement_gradient_angle')}: {form.gradientAngle}°
                    </Label>
                    <Slider
                      min={0}
                      max={359}
                      step={1}
                      value={[form.gradientAngle]}
                      onValueChange={([v]) => setForm((prev) => ({ ...prev, gradientAngle: v }))}
                    />
                  </div>
                  <div
                    className="h-10 w-full rounded-md border"
                    style={{
                      background: `linear-gradient(${form.gradientAngle}deg, ${form.gradientStartColor}, ${form.gradientEndColor})`,
                    }}
                  />
                </TabsContent>

                <TabsContent value="2" className="space-y-4 pt-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Button type="button" variant="outline" asChild>
                      <label className="cursor-pointer">
                        <ImagePlus className="me-2 h-4 w-4" />
                        {t('site_announcement_upload_bg')}
                        <input type="file" accept="image/*" className="sr-only" onChange={handleImageSelect} />
                      </label>
                    </Button>
                    {(previewImageUrl || form.backgroundImageUrl) && (
                      <Button type="button" variant="ghost" size="sm" onClick={handleRemoveBackgroundImage}>
                        <Trash2 className="me-2 h-4 w-4" />
                        {t('site_announcement_remove_bg')}
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{t('site_announcement_bg_image_hint')}</p>
                </TabsContent>
              </Tabs>
            </section>

            <section className="space-y-3">
              <Label>{t('site_announcement_preview_label')}</Label>
              <div
                className="site-announcement-preview w-full overflow-hidden rounded-md border"
                style={{ ...previewStyle, color: form.textColor, maxHeight: 200 }}
              >
                <div
                  className="px-4 py-3 text-sm leading-relaxed [&_img]:inline-block [&_img]:max-h-24 [&_img]:max-w-full [&_img]:align-middle [&_p]:m-0"
                  dangerouslySetInnerHTML={{ __html: form.contentHtml || '<p></p>' }}
                />
              </div>
            </section>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t('saving')}
                </>
              ) : (
                t('save_changes')
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <BannerBackgroundCropDialog
        open={cropDialogOpen}
        onOpenChangeAction={setCropDialogOpen}
        imageSrc={pendingCropSrc}
        onConfirmAction={handleCroppedImage}
      />
    </>
  );
}
