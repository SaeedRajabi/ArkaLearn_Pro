'use client';

import * as React from 'react';
import { Loader2, RotateCcw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import {
  getEmailTemplateByKey,
  listEmailTemplates,
  resetEmailTemplate,
  upsertEmailTemplate,
  type EmailTemplateDetail,
  type EmailTemplateListItem,
} from '@/services/email-templates-api.service';

export function EmailTemplatesManager() {
  const { t , locale } = useLanguage();
  const { toast } = useToast();
  const [templates, setTemplates] = React.useState<EmailTemplateListItem[]>([]);
  const [selectedKey, setSelectedKey] = React.useState('');
  const [form, setForm] = React.useState<EmailTemplateDetail | null>(null);
  const [loadingList, setLoadingList] = React.useState(true);
  const [loadingDetail, setLoadingDetail] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [resetting, setResetting] = React.useState(false);

  const loadList = React.useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoadingList(true);
    }
    try {
      const items = await listEmailTemplates();
      setTemplates(items);
      setSelectedKey((current) => current || items[0]?.templateKey || '');
    } catch {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t('email_templates_load_failed'),
      });
    } finally {
      if (!options?.silent) {
        setLoadingList(false);
      }
    }
  }, [t, toast]);

  const loadDetail = React.useCallback(
    async (key: string) => {
      if (!key) return;
      setLoadingDetail(true);
      try {
        const detail = await getEmailTemplateByKey(key);
        setForm(detail);
      } catch {
        toast({
          variant: 'destructive',
          title: t('validation_error_title'),
          description: t('email_templates_load_failed'),
        });
        setForm(null);
      } finally {
        setLoadingDetail(false);
      }
    },
    [t, toast]
  );

  React.useEffect(() => {
    void loadList();
  }, [loadList]);

  React.useEffect(() => {
    if (selectedKey) void loadDetail(selectedKey);
  }, [selectedKey, loadDetail]);

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    try {
      await upsertEmailTemplate({
        templateKey: form.templateKey,
        displayName: form.displayName,
        description: form.description,
        subject: form.subject,
        bodyHtml: form.bodyHtml,
        isEnabled: form.isEnabled,
      });
      toast({ title: t('toast_settings_saved_title'), description: t('email_templates_save_success') });
      await loadList({ silent: true });
      await loadDetail(form.templateKey);
    } catch {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t('email_templates_save_failed'),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!form?.templateKey) return;
    setResetting(true);
    try {
      await resetEmailTemplate(form.templateKey);
      toast({ title: t('toast_settings_saved_title'), description: t('email_templates_reset_success') });
      await loadList({ silent: true });
      await loadDetail(form.templateKey);
    } catch {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t('email_templates_reset_failed'),
      });
    } finally {
      setResetting(false);
    }
  };

  const selectedListItem = templates.find((item) => item.templateKey === selectedKey);

  if (loadingList) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>{t('email_templates_list_title')}</CardTitle>
          <CardDescription>{t('email_templates_list_description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 p-2">
          {templates.map((item) => (
            <button
              key={item.templateKey}
              type="button"
              onClick={() => setSelectedKey(item.templateKey)}
              className={`w-full rounded-lg px-3 py-2.5 text-start text-sm transition-colors ${
                selectedKey === item.templateKey
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              <div className="font-medium">{item.displayName}</div>
              <div
                className={`mt-0.5 text-xs ${
                  selectedKey === item.templateKey ? 'text-primary-foreground/80' : 'text-muted-foreground'
                }`}
              >
                {item.isCustomized ? t('email_templates_customized') : t('email_templates_default')}
                {!item.isEnabled ? ` · ${t('email_templates_disabled')}` : ''}
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedListItem?.displayName ?? form?.displayName ?? t('email_templates_editor_title')}
          </CardTitle>
          <CardDescription>
            {selectedListItem?.description ?? form?.description ?? t('email_templates_editor_description')}
          </CardDescription>
        </CardHeader>
        {loadingDetail ? (
          <CardContent className="flex min-h-[28rem] items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        ) : !form ? (
          <CardContent className="flex min-h-[28rem] items-center justify-center py-16 text-sm text-muted-foreground">
            {t('email_templates_load_failed')}
          </CardContent>
        ) : (
          <>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
                <div>
                  <Label>{t('email_templates_enabled')}</Label>
                  <p className="text-xs text-muted-foreground">{t('email_templates_enabled_hint')}</p>
                </div>
                <Switch
                  dir={locale==="fa" ? "ltr":"rtl"}
                  checked={form.isEnabled}
                  onCheckedChange={(v) => setForm((p) => (p ? { ...p, isEnabled: v } : p))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-subject">{t('email_templates_subject')}</Label>
                <Input
                  id="template-subject"
                  value={form.subject}
                  onChange={(e) => setForm((p) => (p ? { ...p, subject: e.target.value } : p))}
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-body">{t('email_templates_body')}</Label>
                <p className="text-xs text-muted-foreground">{t('email_templates_placeholders_hint')}</p>
                <Textarea
                  id="template-body"
                  value={form.bodyHtml}
                  onChange={(e) => setForm((p) => (p ? { ...p, bodyHtml: e.target.value } : p))}
                  rows={18}
                  className="font-mono text-xs"
                  dir="rtl"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => void handleSave()} disabled={saving}>
                {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
                {t('email_templates_save')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleReset()}
                disabled={resetting || !form.isCustomized}
              >
                {resetting ? (
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="me-2 h-4 w-4" />
                )}
                {t('email_templates_reset')}
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
