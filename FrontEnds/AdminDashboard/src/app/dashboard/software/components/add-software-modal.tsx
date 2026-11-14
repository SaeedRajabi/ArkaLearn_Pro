'use client';

import * as React from 'react';
import { ImageIcon, Loader2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CustomRichTextEditor } from '@/components/ui/custom-rich-text-editor';
import { MediaPickerDialog } from '@/components/media/MediaPickerDialog';
import { useLanguage } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import { resolveStaticAssetUrl, toSameOriginAssetSrc } from '@/lib/apiClient';
import {
  getPlatformSoftwareBySlug,
  savePlatformSoftware,
  type SoftwareListItem,
} from '@/services/software-api.service';

type Props = {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  software: SoftwareListItem | null;
  onSuccessAction: () => void;
};

const EMPTY_FORM = {
  title: '',
  shortDescription: '',
  longDescriptionHtml: '',
  coverImageUrl: '',
  installerFileUrl: '',
  installerFileName: '',
  categoryId: '',
  tags: '',
  sortOrder: '0',
  seoTitle: '',
  metaDescription: '',
};

export function AddSoftwareModal({ open, onOpenChangeAction, software, onSuccessAction }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [saving, setSaving] = React.useState(false);
  const [loadingDetail, setLoadingDetail] = React.useState(false);
  const [coverPickerOpen, setCoverPickerOpen] = React.useState(false);
  const [installerPickerOpen, setInstallerPickerOpen] = React.useState(false);
  const [form, setForm] = React.useState(EMPTY_FORM);

  React.useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const resetForCreate = () => {
      setForm(EMPTY_FORM);
      setLoadingDetail(false);
    };

    const loadForEdit = async () => {
      if (!software?.slug?.trim()) {
        setForm({
          ...EMPTY_FORM,
          title: software?.title ?? '',
          shortDescription: software?.shortDescription ?? '',
          coverImageUrl: software?.coverImageUrl ?? '',
          categoryId: software?.categoryId ? String(software.categoryId) : '',
          tags: software?.tags.join(', ') ?? '',
          sortOrder: String(software?.sortOrder ?? 0),
        });
        return;
      }

      setLoadingDetail(true);
      try {
        const detail = await getPlatformSoftwareBySlug(software.slug);
        if (cancelled) return;
        if (!detail) {
          toast({ title: t('software_load_failed'), variant: 'destructive' });
          resetForCreate();
          return;
        }
        setForm({
          title: detail.title,
          shortDescription: detail.shortDescription,
          longDescriptionHtml: detail.longDescriptionHtml ?? '',
          coverImageUrl: detail.coverImageUrl ?? '',
          installerFileUrl: detail.installerFileUrl ?? '',
          installerFileName: detail.installerFileName ?? '',
          categoryId: detail.categoryId ? String(detail.categoryId) : '',
          tags: detail.tags.join(', '),
          sortOrder: String(detail.sortOrder ?? software.sortOrder ?? 0),
          seoTitle: detail.seoTitle ?? '',
          metaDescription: detail.metaDescription ?? '',
        });
      } catch {
        if (!cancelled) {
          toast({ title: t('software_load_failed'), variant: 'destructive' });
          resetForCreate();
        }
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    };

    if (software) {
      void loadForEdit();
    } else {
      resetForCreate();
    }

    return () => {
      cancelled = true;
    };
  }, [open, software, t, toast]);

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: t('software_title_required'), variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await savePlatformSoftware({
        softwareId: software?.id,
        title: form.title.trim(),
        shortDescription: form.shortDescription.trim(),
        longDescriptionHtml: form.longDescriptionHtml,
        coverImageUrl: form.coverImageUrl.trim() || undefined,
        installerFileUrl: form.installerFileUrl.trim() || undefined,
        installerFileName: form.installerFileName.trim() || undefined,
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        tags: form.tags.split(/[,،]/).map((tag) => tag.trim()).filter(Boolean),
        sortOrder: Number(form.sortOrder) || 0,
        seoTitle: form.seoTitle,
        metaDescription: form.metaDescription,
      });
      toast({ title: t('software_saved') });
      onOpenChangeAction(false);
      onSuccessAction();
    } catch {
      toast({ title: t('software_save_failed'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const coverPreview = form.coverImageUrl
    ? (toSameOriginAssetSrc(form.coverImageUrl) ?? resolveStaticAssetUrl(form.coverImageUrl))
    : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChangeAction}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{software ? t('software_modal_edit') : t('software_modal_add')}</DialogTitle>
          </DialogHeader>

          {loadingDetail ? (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{t('software_loading_detail')}</span>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>{t('software_field_title')}</Label>
                <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('software_field_short')}</Label>
                <Textarea
                  value={form.shortDescription}
                  onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('software_field_long')}</Label>
                <CustomRichTextEditor
                  content={form.longDescriptionHtml}
                  onChangeAction={(v) => setForm((f) => ({ ...f, longDescriptionHtml: v }))}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('software_field_cover')}</Label>
                  <Button type="button" variant="outline" className="w-full gap-2" onClick={() => setCoverPickerOpen(true)}>
                    <ImageIcon className="h-4 w-4" />
                    {t('software_pick_cover')}
                  </Button>
                  {coverPreview ? (
                    <div className="relative mt-2 h-24 w-full overflow-hidden rounded border bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={coverPreview} alt="" className="h-full w-full object-cover" />
                    </div>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label>{t('software_field_installer')}</Label>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => setInstallerPickerOpen(true)}
                  >
                    <Package className="h-4 w-4" />
                    {t('software_pick_installer')}
                  </Button>
                  {form.installerFileName || form.installerFileUrl ? (
                    <p className="mt-2 break-all text-xs text-muted-foreground">
                      {form.installerFileName || form.installerFileUrl}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('software_field_tags')}</Label>
                <Input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('software_field_seo_title')}</Label>
                  <Input value={form.seoTitle} onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>{t('software_field_meta')}</Label>
                  <Input
                    value={form.metaDescription}
                    onChange={(e) => setForm((f) => ({ ...f, metaDescription: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChangeAction(false)}>
              {t('software_cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving || loadingDetail}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('software_save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MediaPickerDialog
        open={coverPickerOpen}
        onOpenChange={setCoverPickerOpen}
        acceptTypes={['image']}
        isAdmin
        onSelect={(item) => {
          setForm((f) => ({ ...f, coverImageUrl: item.fileUrl }));
          setCoverPickerOpen(false);
        }}
      />

      <MediaPickerDialog
        open={installerPickerOpen}
        onOpenChange={setInstallerPickerOpen}
        acceptTypes={['archive', 'document']}
        isAdmin
        onSelect={(item) => {
          setForm((f) => ({
            ...f,
            installerFileUrl: item.fileUrl,
            installerFileName: item.title || item.caption || item.fileUrl.split('/').pop() || 'installer',
          }));
          setInstallerPickerOpen(false);
        }}
      />
    </>
  );
}
