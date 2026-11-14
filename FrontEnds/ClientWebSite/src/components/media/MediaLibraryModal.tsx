'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  AlertTriangle,
  Archive,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Loader2,
  Pencil,
  Search,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { getDictValue } from '@/lib/i18n-client';
import {
  ALLOWED_UPLOAD_ACCEPT,
  MEDIA_APPROVAL,
  deleteMediaAsset,
  dismissMediaRejection,
  isMediaSelectable,
  listMediaAssets,
  mediaAssetToSelection,
  updateMediaAssetMetadata,
  uploadMediaAsset,
  type MediaAssetItem,
  type MediaSelection,
} from '@/lib/api/media';
import { getArticleImageUrl } from '@/lib/utils/image-url';
import type { Dictionary } from '@/types';
import { cn } from '@/lib/utils';

export type MediaAcceptType = 'image' | 'video' | 'document' | 'archive';

const MEDIA_TYPE_MAP: Record<MediaAcceptType, number> = {
  image: 0,
  video: 1,
  document: 3,
  archive: 4,
};

type Props = {
  dict: Dictionary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: 'pick' | 'manage';
  onSelect?: (item: MediaSelection) => void;
  acceptTypes?: MediaAcceptType[];
};

function t(dict: Dictionary, key: string, fallback: string) {
  return getDictValue(dict, `media.${key}`, fallback);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MediaThumb({ item }: { item: MediaAssetItem }) {
  if (item.mediaType === 0 && item.fileUrl) {
    return (
      <Image
        src={getArticleImageUrl(item.fileUrl)}
        alt={item.altText ?? item.title ?? item.originalFileName}
        fill
        className="object-cover"
        unoptimized
      />
    );
  }
  const Icon =
    item.mediaType === 1
      ? FileVideo
      : item.mediaType === 4
        ? Archive
        : item.originalFileName.match(/\.xlsx?$/i)
          ? FileSpreadsheet
          : FileText;
  return <Icon className="h-10 w-10 text-muted-foreground" />;
}

function FilePreview({ file }: { file: File }) {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

  React.useEffect(() => {
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    return undefined;
  }, [file]);

  if (file.type.startsWith('image/') && previewUrl) {
    return (
      <div className="relative mx-auto aspect-video w-full max-w-md overflow-hidden rounded-lg bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={previewUrl} alt={file.name} className="h-full w-full object-contain" />
      </div>
    );
  }
  if (file.type.startsWith('video/') && previewUrl) {
    return <video src={previewUrl} controls className="mx-auto max-h-64 w-full rounded-lg bg-black" />;
  }

  const Icon = ['doc', 'docx'].includes(ext)
    ? FileText
    : ['xls', 'xlsx'].includes(ext)
      ? FileSpreadsheet
      : Archive;
  return (
    <div className="flex flex-col items-center justify-center rounded-lg bg-muted py-12">
      <Icon className="mb-2 h-16 w-16 text-muted-foreground" />
      <p className="text-sm font-medium">{file.name}</p>
    </div>
  );
}

export function MediaLibraryModal({
  dict,
  open,
  onOpenChange,
  mode = 'manage',
  onSelect,
  acceptTypes = ['image', 'video', 'document', 'archive'],
}: Props) {
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [items, setItems] = React.useState<MediaAssetItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [selected, setSelected] = React.useState<MediaAssetItem | null>(null);
  const [meta, setMeta] = React.useState({ title: '', altText: '', caption: '', description: '' });
  const [saving, setSaving] = React.useState(false);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [uploadMeta, setUploadMeta] = React.useState({ title: '', altText: '', caption: '', description: '' });
  const [uploading, setUploading] = React.useState(false);

  const mediaTypeFilter = acceptTypes.length === 1 ? MEDIA_TYPE_MAP[acceptTypes[0]] : undefined;

  const pendingRejections = items.filter(
    (item) => item.approvalStatus === MEDIA_APPROVAL.rejected && !item.isRejectionDismissed
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await listMediaAssets({
        search: search.trim() || undefined,
        mediaType: mediaTypeFilter,
        pageSize: 48,
      });
      const allowed = new Set(acceptTypes.map((x) => MEDIA_TYPE_MAP[x]));
      setItems(result.items.filter((item) => allowed.has(item.mediaType)));
    } catch {
      toast({ title: t(dict, 'loadError', 'Load failed'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [acceptTypes, dict, mediaTypeFilter, search, toast]);

  React.useEffect(() => {
    if (open) void load();
  }, [open, load]);

  React.useEffect(() => {
    if (selected) {
      setMeta({
        title: selected.title ?? '',
        altText: selected.altText ?? '',
        caption: selected.caption ?? '',
        description: selected.description ?? '',
      });
    }
  }, [selected]);

  const handleItemClick = (item: MediaAssetItem) => {
    if (mode === 'pick') {
      if (!isMediaSelectable(item)) {
        toast({ title: t(dict, 'rejectedNotSelectable', 'Rejected file'), variant: 'destructive' });
        return;
      }
      onSelect?.(mediaAssetToSelection(item));
      onOpenChange(false);
      return;
    }
    setSelected(item);
  };

  const handleSaveMeta = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await updateMediaAssetMetadata({
        id: selected.id,
        title: meta.title || null,
        altText: meta.altText || null,
        caption: meta.caption || null,
        description: meta.description || null,
      });
      toast({ title: t(dict, 'saved', 'Saved') });
      void load();
    } catch {
      toast({ title: t(dict, 'saveError', 'Save failed'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected || !confirm(t(dict, 'deleteConfirm', 'Delete?'))) return;
    try {
      await deleteMediaAsset(selected.id);
      setSelected(null);
      toast({ title: t(dict, 'deleted', 'Deleted') });
      void load();
    } catch {
      toast({ title: t(dict, 'deleteError', 'Delete failed'), variant: 'destructive' });
    }
  };

  const handleDismissRejection = async (id: number) => {
    try {
      await dismissMediaRejection(id);
      void load();
    } catch {
      toast({ title: t(dict, 'saveError', 'Failed'), variant: 'destructive' });
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    try {
      await uploadMediaAsset({
        file: uploadFile,
        title: uploadMeta.title || uploadFile.name,
        altText: uploadMeta.altText,
        caption: uploadMeta.caption,
        description: uploadMeta.description,
      });
      toast({ title: t(dict, 'uploaded', 'Uploaded') });
      setUploadOpen(false);
      setUploadFile(null);
      setUploadMeta({ title: '', altText: '', caption: '', description: '' });
      void load();
    } catch {
      toast({ title: t(dict, 'uploadError', 'Upload failed'), variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {mode === 'pick'
                ? t(dict, 'pickerTitle', 'Media picker')
                : t(dict, 'myLibraryTitle', 'My library')}
            </DialogTitle>
          </DialogHeader>

          {pendingRejections.map((item) => (
            <Alert key={item.id} variant="destructive" className="relative pe-10">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <span className="font-medium">{item.title || item.originalFileName}: </span>
                {item.rejectionReason ?? t(dict, 'rejectedDefaultReason', 'Rejected')}
              </AlertDescription>
              <button
                type="button"
                className="absolute end-2 top-2 rounded p-1 hover:bg-destructive/20"
                onClick={() => void handleDismissRejection(item.id)}
              >
                <X className="h-4 w-4" />
              </button>
            </Alert>
          ))}

          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[180px] flex-1">
              <Search className="absolute start-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="ps-8"
                placeholder={t(dict, 'searchPlaceholder', 'Search...')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void load()}
              />
            </div>
            <Button type="button" variant="outline" onClick={() => void load()}>
              {t(dict, 'search', 'Search')}
            </Button>
            <Button type="button" onClick={() => fileInputRef.current?.click()}>
              <UploadCloud className="me-2 h-4 w-4" />
              {t(dict, 'uploadNew', 'Upload')}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={ALLOWED_UPLOAD_ACCEPT}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setUploadFile(file);
                  setUploadMeta((m) => ({ ...m, title: file.name.replace(/\.[^.]+$/, '') }));
                  setUploadOpen(true);
                }
                e.target.value = '';
              }}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <div>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleItemClick(item)}
                      className={cn(
                        'overflow-hidden rounded-lg border text-start transition hover:border-primary',
                        selected?.id === item.id && mode === 'manage' && 'ring-2 ring-primary',
                        item.approvalStatus === MEDIA_APPROVAL.rejected && 'border-destructive/50'
                      )}
                    >
                      <div className="relative flex aspect-square items-center justify-center bg-muted">
                        <MediaThumb item={item} />
                      </div>
                      <div className="space-y-0.5 p-2">
                        <p className="truncate text-xs font-medium">{item.title || item.originalFileName}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {!loading && items.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">{t(dict, 'empty', 'Empty')}</p>
              ) : null}
            </div>

            {mode === 'manage' ? (
              <aside className="rounded-lg border p-3">
                {selected ? (
                  <div className="space-y-3">
                    <div className="relative aspect-video overflow-hidden rounded-md bg-muted">
                      <MediaThumb item={selected} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t(dict, 'title', 'Title')}</Label>
                      <Input value={meta.title} onChange={(e) => setMeta((m) => ({ ...m, title: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t(dict, 'altText', 'Alt')}</Label>
                      <Input value={meta.altText} onChange={(e) => setMeta((m) => ({ ...m, altText: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t(dict, 'caption', 'Caption')}</Label>
                      <Input value={meta.caption} onChange={(e) => setMeta((m) => ({ ...m, caption: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t(dict, 'description', 'Description')}</Label>
                      <Textarea
                        rows={2}
                        value={meta.description}
                        onChange={(e) => setMeta((m) => ({ ...m, description: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" className="flex-1" disabled={saving} onClick={() => void handleSaveMeta()}>
                        {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Pencil className="me-2 h-4 w-4" />}
                        {t(dict, 'saveMetadata', 'Save')}
                      </Button>
                      <Button type="button" variant="destructive" size="icon" onClick={() => void handleDelete()}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">{t(dict, 'selectHint', 'Select')}</p>
                )}
              </aside>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t(dict, 'uploadPreviewTitle', 'Preview')}</DialogTitle>
          </DialogHeader>
          {uploadFile ? <FilePreview file={uploadFile} /> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t(dict, 'title', 'Title')}</Label>
              <Input value={uploadMeta.title} onChange={(e) => setUploadMeta((m) => ({ ...m, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{t(dict, 'altText', 'Alt')}</Label>
              <Input value={uploadMeta.altText} onChange={(e) => setUploadMeta((m) => ({ ...m, altText: e.target.value }))} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>{t(dict, 'caption', 'Caption')}</Label>
              <Input value={uploadMeta.caption} onChange={(e) => setUploadMeta((m) => ({ ...m, caption: e.target.value }))} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>{t(dict, 'description', 'Description')}</Label>
              <Textarea
                rows={2}
                value={uploadMeta.description}
                onChange={(e) => setUploadMeta((m) => ({ ...m, description: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setUploadOpen(false)}>
              {t(dict, 'cancel', 'Cancel')}
            </Button>
            <Button type="button" disabled={!uploadFile || uploading} onClick={() => void handleUpload()}>
              {uploading ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
              {t(dict, 'upload', 'Upload')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
