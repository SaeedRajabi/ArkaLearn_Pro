'use client';

import * as React from 'react';
import { ChevronDown, Loader2, Mail, RotateCcw, Save, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import { cn } from '@/lib/utils';

/** Extracts {{placeholders}} from subject/body so admins see the usable variables. */
function extractPlaceholders(subject: string, bodyHtml: string): string[] {
  const found = new Set<string>();
  const pattern = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  for (const source of [subject, bodyHtml]) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(source)) !== null) found.add(match[1]);
  }
  return [...found];
}

export function EmailTemplatesManager() {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [templates, setTemplates] = React.useState<EmailTemplateListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [expandedKey, setExpandedKey] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<EmailTemplateDetail | null>(null);
  const [draftLoading, setDraftLoading] = React.useState(false);
  const [savingKey, setSavingKey] = React.useState<string | null>(null);
  const [togglingKey, setTogglingKey] = React.useState<string | null>(null);
  const [resettingKey, setResettingKey] = React.useState<string | null>(null);

  const loadList = React.useCallback(async () => {
    setLoading(true);
    try {
      setTemplates(await listEmailTemplates());
    } catch {
      toast({
        variant: 'destructive',
        title: t('email_templates_load_failed'),
      });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  React.useEffect(() => {
    void loadList();
  }, [loadList]);

  const openEditor = async (row: EmailTemplateListItem) => {
    if (expandedKey === row.templateKey) {
      setExpandedKey(null);
      setDraft(null);
      return;
    }
    setExpandedKey(row.templateKey);
    setDraft(null);
    setDraftLoading(true);
    try {
      const detail = await getEmailTemplateByKey(row.templateKey);
      setDraft(
        detail ?? {
          templateKey: row.templateKey,
          displayName: row.displayName,
          description: row.description,
          isEnabled: row.isEnabled,
          isCustomized: row.isCustomized,
          subject: '',
          bodyHtml: '',
        }
      );
    } catch {
      toast({ variant: 'destructive', title: t('email_templates_load_failed') });
      setExpandedKey(null);
    } finally {
      setDraftLoading(false);
    }
  };

  const patchRow = (templateKey: string, patch: Partial<EmailTemplateListItem>) => {
    setTemplates((prev) =>
      prev.map((row) => (row.templateKey === templateKey ? { ...row, ...patch } : row))
    );
  };

  const toggleEnabled = async (row: EmailTemplateListItem, next: boolean) => {
    setTogglingKey(row.templateKey);
    try {
      const detail =
        expandedKey === row.templateKey && draft
          ? draft
          : (await getEmailTemplateByKey(row.templateKey)) ?? null;
      if (!detail) throw new Error('template not found');
      await upsertEmailTemplate({ ...detail, isEnabled: next });
      patchRow(row.templateKey, { isEnabled: next });
      if (expandedKey === row.templateKey && draft?.templateKey === row.templateKey)
        setDraft({ ...draft, isEnabled: next });
      toast({ title: t('email_templates_save_success') });
    } catch {
      toast({ variant: 'destructive', title: t('email_templates_save_failed') });
    } finally {
      setTogglingKey(null);
    }
  };

  const saveDraft = async () => {
    if (!draft) return;
    setSavingKey(draft.templateKey);
    try {
      await upsertEmailTemplate(draft);
      patchRow(draft.templateKey, { isEnabled: draft.isEnabled, isCustomized: true });
      toast({ title: t('email_templates_save_success') });
    } catch {
      toast({ variant: 'destructive', title: t('email_templates_save_failed') });
    } finally {
      setSavingKey(null);
    }
  };

  const resetDraft = async () => {
    if (!draft) return;
    if (!window.confirm(t('email_templates_reset_confirm'))) return;
    setResettingKey(draft.templateKey);
    try {
      await resetEmailTemplate(draft.templateKey);
      const fresh = await getEmailTemplateByKey(draft.templateKey);
      if (fresh) setDraft(fresh);
      patchRow(draft.templateKey, { isCustomized: false });
      toast({ title: t('email_templates_reset_success') });
    } catch {
      toast({ variant: 'destructive', title: t('email_templates_reset_failed') });
    } finally {
      setResettingKey(null);
    }
  };

  const term = search.trim().toLowerCase();
  const visible = term
    ? templates.filter(
        (row) =>
          row.displayName.toLowerCase().includes(term) ||
          row.templateKey.toLowerCase().includes(term) ||
          row.description.toLowerCase().includes(term)
      )
    : templates;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          {t('email_templates_title')}
        </CardTitle>
        <CardDescription>{t('email_templates_description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('email_templates_search_placeholder')}
            className="ps-9"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : visible.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t('email_templates_empty')}
          </p>
        ) : (
          <div className="space-y-2">
            {visible.map((row) => {
              const isExpanded = expandedKey === row.templateKey;
              return (
                <div key={row.templateKey} className="rounded-xl border bg-background">
                  <div className="flex flex-wrap items-center gap-3 p-3">
                    <button
                      type="button"
                      onClick={() => void openEditor(row)}
                      className="flex min-w-0 flex-1 items-center gap-2 text-start"
                    >
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                          isExpanded && 'rotate-180'
                        )}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{row.displayName}</span>
                        <span className="block truncate text-xs text-muted-foreground" dir="ltr">
                          {row.templateKey}
                        </span>
                      </span>
                    </button>
                    <Badge variant={row.isCustomized ? 'default' : 'outline'} className="shrink-0">
                      {row.isCustomized ? t('email_templates_customized') : t('email_templates_default')}
                    </Badge>
                    <div className="flex shrink-0 items-center gap-2">
                      {togglingKey === row.templateKey ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <Switch
                          checked={row.isEnabled}
                          onCheckedChange={(checked) => void toggleEnabled(row, checked)}
                          aria-label={t('email_templates_enabled')}
                        />
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void openEditor(row)}
                      >
                        {t('email_templates_edit')}
                      </Button>
                    </div>
                  </div>

                  {isExpanded ? (
                    <div className="space-y-4 border-t px-3 py-4">
                      {draftLoading || !draft ? (
                        <div className="flex justify-center py-6">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <Label>{t('email_templates_subject')}</Label>
                            <Input
                              value={draft.subject}
                              onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{t('email_templates_body')}</Label>
                            <Textarea
                              value={draft.bodyHtml}
                              onChange={(e) => setDraft({ ...draft, bodyHtml: e.target.value })}
                              rows={12}
                              className="font-mono text-xs"
                            />
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground">
                              {t('email_templates_available_vars')}
                            </span>
                            {extractPlaceholders(draft.subject, draft.bodyHtml).map((ph) => (
                              <code
                                key={ph}
                                dir="ltr"
                                className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
                              >
                                {`{{${ph}}}`}
                              </code>
                            ))}
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => void resetDraft()}
                              disabled={resettingKey === draft.templateKey}
                            >
                              {resettingKey === draft.templateKey ? (
                                <Loader2 className="me-1 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <RotateCcw className="me-1 h-3.5 w-3.5" />
                              )}
                              {t('email_templates_reset')}
                            </Button>
                            <div className="flex items-center gap-3">
                              <Label className="flex items-center gap-2 text-sm">
                                <Switch
                                  checked={draft.isEnabled}
                                  onCheckedChange={(checked) =>
                                    setDraft({ ...draft, isEnabled: checked })
                                  }
                                />
                                {t('email_templates_enabled')}
                              </Label>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => void saveDraft()}
                                disabled={savingKey === draft.templateKey}
                              >
                                {savingKey === draft.templateKey ? (
                                  <Loader2 className="me-1 h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Save className="me-1 h-3.5 w-3.5" />
                                )}
                                {t('email_templates_save')}
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
