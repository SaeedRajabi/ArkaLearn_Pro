'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/components/language-provider';
import {
  DEFAULT_CONTACT_US_SETTINGS,
  getContactUsSettings,
  upsertContactUsSettings,
  type UpsertContactUsPayload,
} from '@/services/contact-us-api.service';

type ContactField = keyof UpsertContactUsPayload;

export function ContactSettingsForm() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [form, setForm] = React.useState<UpsertContactUsPayload>(DEFAULT_CONTACT_US_SETTINGS);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const loadSettings = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getContactUsSettings();
      setForm(data ? { ...DEFAULT_CONTACT_US_SETTINGS, ...data } : DEFAULT_CONTACT_US_SETTINGS);
    } catch {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t('contact_us_load_failed'),
      });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  React.useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const handleInput =
    (field: ContactField) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      await upsertContactUsSettings(form);
      toast({
        title: t('toast_settings_saved_title'),
        description: t('contact_us_save_success'),
      });
      await loadSettings();
    } catch {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t('contact_us_save_failed'),
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
    <Card>
      <CardHeader>
        <CardTitle>{t('contact_us_page_settings_title')}</CardTitle>
        <CardDescription>{t('contact_us_page_settings_description')}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-8">
          <section className="space-y-4">
            <h3 className="text-base font-semibold">{t('contact_us_section_page')}</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="page-title">{t('contact_us_page_title_label')}</Label>
                <Input id="page-title" value={form.pageTitle} onChange={handleInput('pageTitle')} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="page-subtitle">{t('contact_us_page_subtitle_label')}</Label>
                <Textarea id="page-subtitle" value={form.pageSubtitle} onChange={handleInput('pageSubtitle')} />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-base font-semibold">{t('contact_us_section_hero')}</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="hero-title">{t('contact_us_hero_title_label')}</Label>
                <Input id="hero-title" value={form.heroTitle} onChange={handleInput('heroTitle')} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="hero-subtitle">{t('contact_us_hero_subtitle_label')}</Label>
                <Textarea id="hero-subtitle" value={form.heroSubtitle} onChange={handleInput('heroSubtitle')} />
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-lg border p-4">
            <h3 className="text-base font-semibold">{t('contact_us_section_headquarters')}</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>{t('contact_us_card_title_label')}</Label>
                <Input value={form.headquartersTitle} onChange={handleInput('headquartersTitle')} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>{t('contact_us_address_label')}</Label>
                <Textarea value={form.headquartersAddress} onChange={handleInput('headquartersAddress')} />
              </div>
              <div className="space-y-2">
                <Label>{t('contact_us_phone_label')}</Label>
                <Input value={form.headquartersPhone} onChange={handleInput('headquartersPhone')} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>{t('contact_us_email_label')}</Label>
                <Input value={form.headquartersEmail} onChange={handleInput('headquartersEmail')} dir="ltr" />
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-lg border p-4">
            <h3 className="text-base font-semibold">{t('contact_us_section_contact_info')}</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>{t('contact_us_card_title_label')}</Label>
                <Input value={form.contactInfoTitle} onChange={handleInput('contactInfoTitle')} />
              </div>
              <div className="space-y-2">
                <Label>{t('contact_us_phone_label')}</Label>
                <Input value={form.contactInfoPhone} onChange={handleInput('contactInfoPhone')} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>{t('contact_us_email_label')}</Label>
                <Input value={form.contactInfoEmail} onChange={handleInput('contactInfoEmail')} dir="ltr" />
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-lg border p-4">
            <h3 className="text-base font-semibold">{t('contact_us_section_sales_support')}</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>{t('contact_us_card_title_label')}</Label>
                <Input value={form.salesSupportTitle} onChange={handleInput('salesSupportTitle')} />
              </div>
              <div className="space-y-2">
                <Label>{t('contact_us_phone_label')}</Label>
                <Input value={form.salesSupportPhone} onChange={handleInput('salesSupportPhone')} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>{t('contact_us_email_label')}</Label>
                <Input value={form.salesSupportEmail} onChange={handleInput('salesSupportEmail')} dir="ltr" />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-base font-semibold">{t('contact_us_section_form')}</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>{t('contact_us_form_title_label')}</Label>
                <Input value={form.formTitle} onChange={handleInput('formTitle')} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>{t('contact_us_form_description_label')}</Label>
                <Textarea value={form.formDescription} onChange={handleInput('formDescription')} />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-base font-semibold">{t('contact_us_section_map')}</h3>
            <div className="space-y-2">
              <Label>{t('contact_us_map_embed_label')}</Label>
              <Textarea value={form.mapEmbedUrl} onChange={handleInput('mapEmbedUrl')} dir="ltr" rows={3} />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-base font-semibold">{t('contact_us_section_social')}</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Facebook</Label>
                <Input value={form.facebookUrl} onChange={handleInput('facebookUrl')} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>Twitter / X</Label>
                <Input value={form.twitterUrl} onChange={handleInput('twitterUrl')} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>Instagram</Label>
                <Input value={form.instagramUrl} onChange={handleInput('instagramUrl')} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>LinkedIn</Label>
                <Input value={form.linkedInUrl} onChange={handleInput('linkedInUrl')} dir="ltr" />
              </div>
            </div>
          </section>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('save_changes')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
