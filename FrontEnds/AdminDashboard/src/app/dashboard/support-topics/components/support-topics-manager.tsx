'use client';

import * as React from 'react';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CustomRichTextEditor } from '@/components/ui/custom-rich-text-editor';
import { useLanguage } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import {
  deletePlatformSupportTopic,
  getPlatformSupportTopicById,
  listPlatformSupportTopics,
  upsertPlatformSupportTopic,
  type PlatformSupportTopicDetail,
  type PlatformSupportTopicListItem,
} from '@/services/platform-support-topics-api.service';

const DEPARTMENTS = ['Support', 'Services', 'Sales', 'SoftwareDevelopment'] as const;

const EMPTY_FORM: PlatformSupportTopicDetail = {
  id: 0,
  title: '',
  summary: '',
  contentHtml: '',
  department: null,
  sortOrder: 0,
  isPublished: true,
  isAdminTopic: true,
};

export function SupportTopicsManager() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [topics, setTopics] = React.useState<PlatformSupportTopicListItem[]>([]);
  const [selectedId, setSelectedId] = React.useState<number | 'new' | null>(null);
  const [form, setForm] = React.useState<PlatformSupportTopicDetail>(EMPTY_FORM);
  const [loadingList, setLoadingList] = React.useState(true);
  const [loadingDetail, setLoadingDetail] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const departmentLabel = (dept: string) => {
    const map: Record<string, string> = {
      Support: t('support_topics_dept_support'),
      Services: t('support_topics_dept_services'),
      Sales: t('support_topics_dept_sales'),
      SoftwareDevelopment: t('support_topics_dept_software'),
    };
    return map[dept] ?? dept;
  };

  const loadList = React.useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoadingList(true);
    try {
      const items = await listPlatformSupportTopics();
      setTopics(items);
    } catch {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t('support_topics_load_failed'),
      });
    } finally {
      if (!options?.silent) setLoadingList(false);
    }
  }, [t, toast]);

  const loadDetail = React.useCallback(
    async (id: number) => {
      setLoadingDetail(true);
      try {
        const detail = await getPlatformSupportTopicById(id);
        setForm(detail ?? EMPTY_FORM);
      } catch {
        toast({
          variant: 'destructive',
          title: t('validation_error_title'),
          description: t('support_topics_load_failed'),
        });
        setForm(EMPTY_FORM);
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
    if (selectedId === 'new') {
      setForm({ ...EMPTY_FORM });
      return;
    }
    if (typeof selectedId === 'number' && selectedId > 0) {
      void loadDetail(selectedId);
    }
  }, [selectedId, loadDetail]);

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t('support_topics_title_required'),
      });
      return;
    }
    if (!form.contentHtml.replace(/<[^>]+>/g, '').trim()) {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t('support_topics_content_required'),
      });
      return;
    }

    setSaving(true);
    try {
      const savedId = await upsertPlatformSupportTopic({
        id: form.id > 0 ? form.id : null,
        title: form.title,
        summary: form.summary,
        contentHtml: form.contentHtml,
        department: form.department || null,
        sortOrder: form.sortOrder,
        isPublished: form.isPublished,
      });
      toast({ title: t('toast_settings_saved_title'), description: t('support_topics_save_success') });
      await loadList({ silent: true });
      setSelectedId(savedId > 0 ? savedId : selectedId);
      if (savedId > 0) await loadDetail(savedId);
    } catch {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t('support_topics_save_failed'),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!form.id || form.id <= 0) return;
    if (!window.confirm(t('support_topics_delete_confirm'))) return;

    setDeleting(true);
    try {
      await deletePlatformSupportTopic(form.id);
      toast({ title: t('toast_settings_saved_title'), description: t('support_topics_delete_success') });
      setSelectedId(null);
      setForm(EMPTY_FORM);
      await loadList({ silent: true });
    } catch {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t('support_topics_delete_failed'),
      });
    } finally {
      setDeleting(false);
    }
  };

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
          <CardTitle>{t('support_topics_list_title')}</CardTitle>
          <CardDescription>{t('support_topics_list_description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 p-2">
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start"
            onClick={() => setSelectedId('new')}
          >
            <Plus className="h-4 w-4" />
            <span className="ms-2">{t('support_topics_new')}</span>
          </Button>
          {topics.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className={`w-full rounded-md px-3 py-2 text-start text-sm transition hover:bg-muted ${
                selectedId === item.id ? 'bg-muted font-medium' : ''
              }`}
            >
              <div className="line-clamp-1">{item.title}</div>
              {!item.isPublished ? (
                <div className="text-xs text-muted-foreground">{t('support_topics_draft')}</div>
              ) : null}
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedId === 'new'
              ? t('support_topics_new')
              : form.title || t('support_topics_edit_title')}
          </CardTitle>
          <CardDescription>{t('support_topics_form_description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingDetail ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : selectedId == null ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t('support_topics_select_hint')}</p>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="support-topic-title">{t('support_topics_field_title')}</Label>
                <Input
                  id="support-topic-title"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-topic-summary">{t('support_topics_field_summary')}</Label>
                <Textarea
                  id="support-topic-summary"
                  value={form.summary}
                  onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('support_topics_field_department')}</Label>
                  <Select
                    value={form.department || 'none'}
                    onValueChange={(v) =>
                      setForm((prev) => ({ ...prev, department: v === 'none' ? null : v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('support_topics_dept_any')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('support_topics_dept_any')}</SelectItem>
                      {DEPARTMENTS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {departmentLabel(d)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support-topic-sort">{t('support_topics_field_sort')}</Label>
                  <Input
                    id="support-topic-sort"
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) || 0 }))
                    }
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <div>
                  <Label>{t('support_topics_field_published')}</Label>
                  <p className="text-xs text-muted-foreground">{t('support_topics_published_hint')}</p>
                </div>
                <Switch
                  checked={form.isPublished}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isPublished: checked }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('support_topics_field_content')}</Label>
                <CustomRichTextEditor
                  content={form.contentHtml}
                  onChangeAction={(html) => setForm((prev) => ({ ...prev, contentHtml: html }))}
                />
              </div>
            </>
          )}
        </CardContent>
        {selectedId != null && !loadingDetail ? (
          <CardFooter className="justify-between gap-2">
            {form.id > 0 ? (
              <Button type="button" variant="destructive" disabled={deleting} onClick={() => void handleDelete()}>
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                <span className="ms-2">{t('support_topics_delete')}</span>
              </Button>
            ) : (
              <span />
            )}
            <Button type="button" disabled={saving} onClick={() => void handleSave()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span className="ms-2">{t('support_topics_save')}</span>
            </Button>
          </CardFooter>
        ) : null}
      </Card>
    </div>
  );
}
