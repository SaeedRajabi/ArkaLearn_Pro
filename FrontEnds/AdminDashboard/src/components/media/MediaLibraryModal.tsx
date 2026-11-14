'use client';

import * as React from 'react';
import {
  AlertTriangle,
  Archive,
  FileSpreadsheet,
  FileText,
  FileVideo,
  ImageIcon,
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
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import {
  ALLOWED_UPLOAD_ACCEPT,
  MEDIA_APPROVAL,
  deleteMediaAsset,
  dismissMediaRejection,
  isMediaSelectable,
  listMediaAssets,
  mediaAssetToSelection,
  rejectMediaAsset,
  updateMediaAssetMetadata,
  uploadMediaAsset,
  type MediaAssetItem,
  type MediaSelection,
} from '@/services/media-api.service';
import { resolveStaticAssetUrl, toSameOriginAssetSrc } from '@/lib/apiClient';
import { isValidLongId } from '@/lib/id';
import { cn } from '@/lib/utils';

export type MediaAcceptType = 'image' | 'video' | 'document' | 'archive';

const MEDIA_TYPE_MAP: Record<MediaAcceptType, number> = {
  image: 0,
  video: 1,
  document: 3,
  archive: 4,
};

const DEFAULT_ACCEPT_TYPES: MediaAcceptType[] = ['image', 'video', 'document', 'archive'];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: 'pick' | 'manage';
  onSelect?: (item: MediaSelection) => void;
  acceptTypes?: MediaAcceptType[];
  ownerUserId?: string;
  ownerName?: string;
  isAdmin?: boolean;
  /** Hide desktop-encrypt switch and always upload public videos (e.g. course intro). */
  preferPublicVideoUpload?: boolean;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function matchesAcceptTypes(item: MediaAssetItem, acceptKey: string): boolean {
  const types = acceptKey.split(',').filter(Boolean) as MediaAcceptType[];
  if (types.length === 0) return true;

  return types.some((type) => {
    const mapped = MEDIA_TYPE_MAP[type];
    if (item.mediaType === mapped) return true;
    const mime = item.mimeType.toLowerCase();
    const fileName = item.originalFileName.toLowerCase();
    if (type === 'image' && mime.startsWith('image/')) return true;
    if (type === 'video' && mime.startsWith('video/')) return true;
    if (type === 'archive' && (item.mediaType === 4 || /\.(zip|rar|7z|exe|msi|dmg|pkg|deb|rpm|apk)$/i.test(fileName))) {
      return true;
    }
    if (type === 'document' && (item.mediaType === 3 || /\.(docx?|xlsx?|pdf)$/i.test(fileName))) return true;
    return false;
  });
}

function isImageAsset(item: MediaAssetItem): boolean {
  return item.mediaType === 0 || item.mimeType.toLowerCase().startsWith('image/');
}

function MediaThumb({ item, className }: { item: MediaAssetItem; className?: string }) {
  const src = item.fileUrl ? (toSameOriginAssetSrc(item.fileUrl) ?? resolveStaticAssetUrl(item.fileUrl)) : '';
  if (isImageAsset(item) && src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={item.altText ?? item.title ?? item.originalFileName}
        className={cn('absolute inset-0 h-full w-full object-cover', className)}
        loading="lazy"
      />
    );
  }
  const Icon =
    item.mediaType === 1
      ? FileVideo
      : item.mediaType === 4
        ? Archive
        : item.mimeType.includes('sheet') || item.originalFileName.match(/\.xlsx?$/i)
          ? FileSpreadsheet
          : FileText;
  return <Icon className="h-10 w-10 text-muted-foreground" />;
}

function FilePreview({ file, className }: { file: File; className?: string }) {
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
      <div className={cn('relative aspect-video w-full overflow-hidden rounded-xl bg-muted/60 ring-1 ring-border', className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={previewUrl} alt={file.name} className="h-full w-full object-contain p-3" />
      </div>
    );
  }
  if (file.type.startsWith('video/') && previewUrl) {
    return (
      <video
        src={previewUrl}
        controls
        className={cn('mx-auto max-h-72 w-full rounded-xl bg-black ring-1 ring-border', className)}
      />
    );
  }

  const Icon = ['doc', 'docx'].includes(ext)
    ? FileText
    : ['xls', 'xlsx'].includes(ext)
      ? FileSpreadsheet
      : Archive;
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-xl bg-muted/60 py-14 ring-1 ring-border', className)}>
      <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-background shadow-sm">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="max-w-full truncate px-4 text-sm font-medium">{file.name}</p>
      <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
    </div>
  );
}

export function MediaLibraryModal({
  open,
  onOpenChange,
  mode = 'manage',
  onSelect,
  acceptTypes = DEFAULT_ACCEPT_TYPES,
  ownerUserId,
  ownerName,
  isAdmin = false,
  preferPublicVideoUpload = false,
}: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const acceptTypesKey = acceptTypes.join(',');

  const [items, setItems] = React.useState<MediaAssetItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [selected, setSelected] = React.useState<MediaAssetItem | null>(null);
  const [meta, setMeta] = React.useState({ title: '', altText: '', caption: '', description: '' });
  const [saving, setSaving] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState('');
  const [showRejectForm, setShowRejectForm] = React.useState(false);

  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [uploadMeta, setUploadMeta] = React.useState({
    title: '',
    altText: '',
    caption: '',
    description: '',
  });
  const [uploading, setUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [encryptForDesktop, setEncryptForDesktop] = React.useState(false);

  const mediaTypeFilter = React.useMemo(() => {
    const types = acceptTypesKey.split(',').filter(Boolean) as MediaAcceptType[];
    return types.length === 1 ? MEDIA_TYPE_MAP[types[0]] : undefined;
  }, [acceptTypesKey]);

  const pendingRejections = items.filter(
    (item) =>
      item.approvalStatus === MEDIA_APPROVAL.rejected &&
      !item.isRejectionDismissed &&
      !isAdmin
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await listMediaAssets({
        ownerUserId,
        search: search.trim() || undefined,
        mediaType: mediaTypeFilter,
        pageSize: 48,
      });
      let filtered = result.items;
      if (acceptTypesKey) {
        filtered = filtered.filter((item) => matchesAcceptTypes(item, acceptTypesKey));
      }
      setItems(filtered);
    } catch {
      toast({ title: t('media.loadError'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [acceptTypesKey, mediaTypeFilter, ownerUserId, search, t, toast]);

  const loadRef = React.useRef(load);
  loadRef.current = load;

  React.useEffect(() => {
    if (!open) return;

    setSearch('');
    setSelected(null);
    setItems([]);

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const result = await listMediaAssets({
          ownerUserId,
          mediaType: mediaTypeFilter,
          pageSize: 48,
        });
        if (cancelled) return;
        const filtered = acceptTypesKey
          ? result.items.filter((item) => matchesAcceptTypes(item, acceptTypesKey))
          : result.items;
        setItems(filtered);
      } catch {
        if (!cancelled) toast({ title: t('media.loadError'), variant: 'destructive' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, ownerUserId, mediaTypeFilter, acceptTypesKey, t, toast]);

  React.useEffect(() => {
    if (selected) {
      setMeta({
        title: selected.title ?? '',
        altText: selected.altText ?? '',
        caption: selected.caption ?? '',
        description: selected.description ?? '',
      });
      setShowRejectForm(false);
      setRejectReason('');
    }
  }, [selected]);

  const handleItemClick = (item: MediaAssetItem) => {
    if (mode === 'pick') {
      if (!isMediaSelectable(item)) {
        toast({ title: t('media.rejectedNotSelectable'), variant: 'destructive' });
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
      toast({ title: t('media.saved') });
      void load();
    } catch {
      toast({ title: t('media.saveError'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected || !confirm(t('media.deleteConfirm'))) return;
    try {
      await deleteMediaAsset(selected.id);
      setSelected(null);
      toast({ title: t('media.deleted') });
      void load();
    } catch {
      toast({ title: t('media.deleteError'), variant: 'destructive' });
    }
  };

  const handleReject = async () => {
    if (!selected || !rejectReason.trim()) return;
    setSaving(true);
    try {
      await rejectMediaAsset(selected.id, rejectReason.trim());
      toast({ title: t('media.rejected') });
      setShowRejectForm(false);
      setRejectReason('');
      void load();
    } catch {
      toast({ title: t('media.rejectError'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDismissRejection = async (id: string) => {
    try {
      await dismissMediaRejection(id);
      void load();
    } catch {
      toast({ title: t('media.saveError'), variant: 'destructive' });
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const uploaded = await uploadMediaAsset(
        {
          file: uploadFile,
          ownerUserId,
          title: uploadMeta.title || uploadFile.name,
          altText: uploadMeta.altText,
          caption: uploadMeta.caption,
          description: uploadMeta.description,
          encryptForDesktop:
            !preferPublicVideoUpload &&
            encryptForDesktop &&
            uploadFile.type.startsWith('video/'),
        },
        (percent) => setUploadProgress(percent)
      );
      const newId = uploaded.id;
      setUploadProgress(100);
      toast({ title: t('media.uploaded') });
      setUploadOpen(false);
      setUploadFile(null);
      setUploadMeta({ title: '', altText: '', caption: '', description: '' });
      setEncryptForDesktop(false);
      await load();
      if (mode === 'pick' && onSelect && isValidLongId(newId)) {
        const result = await listMediaAssets({
          ownerUserId,
          mediaType: mediaTypeFilter,
          pageSize: 48,
        });
        const uploaded = result.items.find((item) => item.id === newId);
        if (uploaded && isMediaSelectable(uploaded)) {
          onSelect(mediaAssetToSelection(uploaded));
          onOpenChange(false);
        }
      }
    } catch (error) {
      toast({
        title: t('media.uploadError'),
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const title =
    mode === 'pick'
      ? t('media.pickerTitle')
      : ownerName
        ? t('media.userLibraryTitle').replace('{name}', ownerName)
        : t('media.myLibraryTitle');

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[min(92dvh,100vh)] max-w-4xl flex-col gap-4 overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pe-1">
          {pendingRejections.map((item) => (
            <Alert key={item.id} variant="destructive" className="relative pe-10">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <span className="font-medium">{item.title || item.originalFileName}: </span>
                {item.rejectionReason ?? t('media.rejectedDefaultReason')}
              </AlertDescription>
              <button
                type="button"
                className="absolute end-2 top-2 rounded p-1 hover:bg-destructive/20"
                aria-label={t('media.dismissRejection')}
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
                placeholder={t('media.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void load()}
              />
            </div>
            <Button type="button" variant="outline" onClick={() => void load()}>
              {t('media.search')}
            </Button>
            <Button type="button" onClick={() => fileInputRef.current?.click()}>
              <UploadCloud className="me-2 h-4 w-4" />
              {t('media.uploadNew')}
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
                        item.approvalStatus === MEDIA_APPROVAL.rejected && 'border-destructive/50 opacity-80'
                      )}
                    >
                      <div className="relative flex aspect-square items-center justify-center bg-muted">
                        <MediaThumb item={item} />
                        {item.approvalStatus === MEDIA_APPROVAL.rejected ? (
                          <span className="absolute start-1 top-1 rounded bg-destructive px-1.5 py-0.5 text-[10px] text-destructive-foreground">
                            {t('media.statusRejected')}
                          </span>
                        ) : null}
                      </div>
                      <div className="space-y-0.5 p-2">
                        <p className="truncate text-xs font-medium">{item.title || item.originalFileName}</p>
                        <p className="text-[10px] text-muted-foreground">{formatBytes(item.fileSizeBytes)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {!loading && items.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">{t('media.empty')}</p>
              ) : null}
            </div>

            {mode === 'manage' ? (
              <aside className="rounded-lg border p-3 lg:sticky lg:top-0 lg:max-h-[min(70dvh,560px)] lg:overflow-y-auto">
                {selected ? (
                  <div className="space-y-3">
                    <div className="relative aspect-video overflow-hidden rounded-md bg-muted">
                      <MediaThumb item={selected} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('media.title')}</Label>
                      <Input value={meta.title} onChange={(e) => setMeta((m) => ({ ...m, title: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('media.altText')}</Label>
                      <Input value={meta.altText} onChange={(e) => setMeta((m) => ({ ...m, altText: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('media.caption')}</Label>
                      <Input value={meta.caption} onChange={(e) => setMeta((m) => ({ ...m, caption: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('media.description')}</Label>
                      <Textarea
                        rows={2}
                        value={meta.description}
                        onChange={(e) => setMeta((m) => ({ ...m, description: e.target.value }))}
                      />
                    </div>
                    <div className="sticky bottom-0 z-10 -mx-3 flex flex-wrap gap-2 border-t bg-background/95 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                      <Button type="button" className="flex-1" disabled={saving} onClick={() => void handleSaveMeta()}>
                        {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Pencil className="me-2 h-4 w-4" />}
                        {t('media.saveMetadata')}
                      </Button>
                      <Button type="button" variant="destructive" size="icon" onClick={() => void handleDelete()}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {isAdmin && ownerUserId ? (
                      showRejectForm ? (
                        <div className="space-y-2 border-t pt-3">
                          <Label>{t('media.rejectReason')}</Label>
                          <Textarea
                            rows={2}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder={t('media.rejectReasonPlaceholder')}
                          />
                          <div className="flex gap-2">
                            <Button type="button" variant="destructive" size="sm" disabled={saving} onClick={() => void handleReject()}>
                              {t('media.confirmReject')}
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => setShowRejectForm(false)}>
                              {t('media.cancel')}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button type="button" variant="outline" className="w-full" onClick={() => setShowRejectForm(true)}>
                          {t('media.rejectFile')}
                        </Button>
                      )
                    ) : null}
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">{t('media.selectHint')}</p>
                )}
              </aside>
            ) : null}
          </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="flex max-h-[min(92dvh,100vh)] max-w-xl flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="shrink-0 space-y-1 border-b bg-muted/30 px-6 py-5 text-start">
            <DialogTitle className="text-lg">{t('media.uploadPreviewTitle')}</DialogTitle>
            <p className="text-sm text-muted-foreground">{t('media.uploadPreviewSubtitle')}</p>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
            {uploadFile ? (
              <div className="space-y-5">
                <FilePreview file={uploadFile} />

                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t('media.fileInfo')}
                  </p>
                  <dl className="grid gap-3 text-sm sm:grid-cols-3">
                    <div className="min-w-0">
                      <dt className="text-muted-foreground">{t('media.fileName')}</dt>
                      <dd className="truncate font-medium" title={uploadFile.name}>
                        {uploadFile.name}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{t('media.fileSize')}</dt>
                      <dd className="font-medium">{formatBytes(uploadFile.size)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{t('media.fileType')}</dt>
                      <dd className="font-medium">{uploadFile.type || uploadFile.name.split('.').pop()?.toUpperCase()}</dd>
                    </div>
                  </dl>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="media-upload-title">{t('media.title')}</Label>
                    <Input
                      id="media-upload-title"
                      value={uploadMeta.title}
                      onChange={(e) => setUploadMeta((m) => ({ ...m, title: e.target.value }))}
                      placeholder={uploadFile.name}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="media-upload-alt">{t('media.altText')}</Label>
                    <Input
                      id="media-upload-alt"
                      value={uploadMeta.altText}
                      onChange={(e) => setUploadMeta((m) => ({ ...m, altText: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="media-upload-caption">{t('media.caption')}</Label>
                    <Input
                      id="media-upload-caption"
                      value={uploadMeta.caption}
                      onChange={(e) => setUploadMeta((m) => ({ ...m, caption: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="media-upload-description">{t('media.description')}</Label>
                    <Textarea
                      id="media-upload-description"
                      rows={3}
                      value={uploadMeta.description}
                      onChange={(e) => setUploadMeta((m) => ({ ...m, description: e.target.value }))}
                      className="resize-none"
                    />
                  </div>
                </div>
                {uploadFile.type.startsWith('video/') && isAdmin && !preferPublicVideoUpload ? (
                  <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-4">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">{t('media.encryptForDesktop')}</Label>
                      <p className="text-xs text-muted-foreground">{t('media.encryptForDesktopDesc')}</p>
                    </div>
                    <Switch checked={encryptForDesktop} onCheckedChange={setEncryptForDesktop} />
                  </div>
                ) : null}
                {uploading ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t('media.uploading')}</span>
                      <span className="font-medium tabular-nums">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-col-reverse gap-2 border-t bg-background px-6 py-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setUploadOpen(false)}>
              {t('media.cancel')}
            </Button>
            <Button type="button" disabled={!uploadFile || uploading} onClick={() => void handleUpload()}>
              {uploading ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <UploadCloud className="me-2 h-4 w-4" />}
              {t('media.upload')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
