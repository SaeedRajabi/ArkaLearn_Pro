'use client';

import * as React from 'react';
import {
  Eye,
  Heart,
  ImageIcon,
  Loader2,
  MessageCircle,
  Pencil,
  Trash2,
  Upload,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getDictValue } from '@/lib/i18n-client';
import { useLanguage } from '@/contexts/language-context';
import { PromotionalVideoPlayer } from '@/components/shared/promotional-video-player';
import {
  deletePromotionalVideo,
  getMyPromotionalVideos,
  MAX_THUMBNAIL_BYTES,
  MAX_VIDEO_BYTES,
  savePromotionalVideo,
  uploadPromotionalVideoFile,
  uploadPromotionalVideoThumbnail,
  type PromotionalVideoApprovalStatus,
  type TeacherPromotionalVideo,
} from '@/lib/api/professor-promotional-videos';
import { getApiErrorMessage } from '@/lib/api/client';
import { getMediaUploadSettings } from '@/lib/api/media-upload-settings';
import { cn } from '@/lib/utils';
import type { Dictionary } from '@/types';

type Props = { dict: Dictionary };

function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(Number.isFinite(video.duration) ? Math.round(video.duration) : 0);
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      resolve(0);
    };
    video.src = URL.createObjectURL(file);
  });
}

function statusBadgeVariant(status: PromotionalVideoApprovalStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'approved') return 'default';
  if (status === 'pending') return 'secondary';
  if (status === 'rejected') return 'destructive';
  return 'outline';
}

function ThumbnailPicker({
  id,
  label,
  hint,
  previewUrl,
  onFile,
  disabled,
}: {
  id: string;
  label: string;
  hint?: string;
  previewUrl?: string | null;
  onFile: (file: File | null) => void;
  disabled?: boolean;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="relative aspect-video w-full max-w-[220px] overflow-hidden rounded-lg border bg-muted">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full min-h-[120px] items-center justify-center text-muted-foreground">
              <ImageIcon className="h-8 w-8 opacity-40" />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <Input
            id={id}
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            disabled={disabled}
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
          {previewUrl ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-fit"
              disabled={disabled}
              onClick={() => {
                onFile(null);
                if (inputRef.current) inputRef.current.value = '';
              }}
            >
              Remove
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SavedVideoCard({
  video,
  t,
  onChanged,
}: {
  video: TeacherPromotionalVideo;
  t: (key: string, fb: string) => string;
  onChanged: () => void;
}) {
  const { toast } = useToast();
  const [busy, setBusy] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [title, setTitle] = React.useState(video.title);
  const [thumbnailPreview, setThumbnailPreview] = React.useState<string | null>(null);
  const thumbnailInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setTitle(video.title);
  }, [video.title]);

  React.useEffect(() => {
    return () => {
      if (thumbnailPreview?.startsWith('blob:')) URL.revokeObjectURL(thumbnailPreview);
    };
  }, [thumbnailPreview]);

  const statusLabel = t(`professorDashboard.videos.status.${video.approvalStatus}`, video.approvalStatus);

  const saveChanges = async (nextThumbnailUrl?: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      await savePromotionalVideo({
        videoId: video.id,
        title: trimmed,
        videoUrl: video.videoUrl,
        thumbnailUrl: nextThumbnailUrl ?? video.thumbnailUrl,
        sortOrder: video.sortOrder,
      });
      toast({ title: t('professorDashboard.videos.saved', 'Video updated') });
      setEditing(false);
      onChanged();
    } catch (error) {
      toast({
        title: getApiErrorMessage(error, t('professorDashboard.videos.saveError', 'Could not save video')),
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  const onThumbnailChange = async (file: File | null) => {
    if (!file) {
      setThumbnailPreview(null);
      return;
    }
    if (file.size > MAX_THUMBNAIL_BYTES) {
      toast({
        title: t('professorDashboard.videos.thumbnailTooLarge', 'Thumbnail must be 5 MB or smaller.'),
        variant: 'destructive',
      });
      return;
    }
    setThumbnailPreview(URL.createObjectURL(file));
    setBusy(true);
    try {
      const thumbnailUrl = await uploadPromotionalVideoThumbnail(file);
      await saveChanges(thumbnailUrl);
      toast({ title: t('professorDashboard.videos.thumbnailUpdated', 'Cover image updated') });
    } catch (error) {
      toast({
        title: getApiErrorMessage(error, t('professorDashboard.videos.thumbnailError', 'Could not upload cover')),
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
    }
  };

  const remove = async () => {
    if (!window.confirm(t('professorDashboard.videos.deleteConfirm', 'Delete this video?'))) return;
    setBusy(true);
    try {
      await deletePromotionalVideo(video.id);
      toast({ title: t('professorDashboard.videos.deleted', 'Video deleted') });
      onChanged();
    } catch (error) {
      toast({
        title: getApiErrorMessage(error, t('professorDashboard.videos.deleteError', 'Could not delete video')),
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  const displayThumbnail = thumbnailPreview ?? video.thumbnailUrl;

  return (
    <Card className="flex h-full flex-col overflow-hidden border shadow-sm transition-shadow hover:shadow-md">
      <div className="relative">
        <PromotionalVideoPlayer
          videoUrl={video.videoUrl}
          thumbnailUrl={displayThumbnail}
          title={video.title}
          className="rounded-none"
        />
        <div className="absolute start-3 top-3">
          <Badge variant={statusBadgeVariant(video.approvalStatus)}>{statusLabel}</Badge>
        </div>
      </div>

      <CardHeader className="space-y-2 pb-2">
        {editing ? (
          <div className="space-y-2">
            <Label htmlFor={`edit-title-${video.id}`}>{t('professorDashboard.videos.titleLabel', 'Title')}</Label>
            <Input
              id={`edit-title-${video.id}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={busy}
            />
          </div>
        ) : (
          <CardTitle className="line-clamp-2 text-base leading-snug">{video.title}</CardTitle>
        )}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 pb-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {video.viewCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <Heart className="h-4 w-4" />
            {video.likeCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            {video.commentCount}
          </span>
        </div>

        {editing ? (
          <div className="space-y-2">
            <Label>{t('professorDashboard.videos.thumbnailLabel', 'Cover image')}</Label>
            <Input
              ref={thumbnailInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              disabled={busy}
              onChange={(e) => void onThumbnailChange(e.target.files?.[0] ?? null)}
            />
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="mt-auto flex flex-wrap gap-2 border-t bg-muted/20 px-4 py-3">
        {editing ? (
          <>
            <Button size="sm" disabled={busy} onClick={() => void saveChanges()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t('professorDashboard.videos.saveChanges', 'Save')}
            </Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => setEditing(false)}>
              {t('professorDashboard.videos.cancel', 'Cancel')}
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="secondary" className="gap-1.5" disabled={busy} onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" />
              {t('professorDashboard.videos.edit', 'Edit')}
            </Button>
            <Button size="sm" variant="destructive" className="gap-1.5" disabled={busy} onClick={() => void remove()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              {t('professorDashboard.videos.delete', 'Delete')}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}

export function ProfessorPromotionalVideosPageClient({ dict }: Props) {
  const { toast } = useToast();
  const { isRtl } = useLanguage();
  const t = React.useCallback(
    (key: string, fb: string) => getDictValue(dict, key, fb),
    [dict]
  );

  const [videos, setVideos] = React.useState<TeacherPromotionalVideo[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [file, setFile] = React.useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = React.useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = React.useState<string | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = React.useState<string | null>(null);
  const [promotionalMaxMinutes, setPromotionalMaxMinutes] = React.useState(5);
  const [durationSeconds, setDurationSeconds] = React.useState<number | undefined>();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const thumbnailInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!file) {
      setVideoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setVideoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  React.useEffect(() => {
    if (!thumbnailFile) {
      setThumbnailPreview(null);
      return;
    }
    const url = URL.createObjectURL(thumbnailFile);
    setThumbnailPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [thumbnailFile]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const list = await getMyPromotionalVideos();
      setVideos(list);
    } catch (error) {
      toast({
        title: getApiErrorMessage(error, t('professorDashboard.videos.loadError', 'Could not load videos')),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    void getMediaUploadSettings()
      .then((settings) => setPromotionalMaxMinutes(settings.promotionalVideoMaxDurationMinutes || 5))
      .catch(() => setPromotionalMaxMinutes(5));
  }, []);

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0] ?? null;
    if (next && next.size > MAX_VIDEO_BYTES) {
      toast({
        title: t('professorDashboard.videos.tooLarge', 'Video must be 50 MB or smaller.'),
        variant: 'destructive',
      });
      event.target.value = '';
      return;
    }
    if (next) {
      const selectedDuration = await readVideoDuration(next);
      if (selectedDuration > promotionalMaxMinutes * 60) {
        toast({
          title: isRtl
            ? `ویدئو نمی‌تواند بیشتر از ${promotionalMaxMinutes} دقیقه باشد.`
            : `Video cannot be longer than ${promotionalMaxMinutes} minutes.`,
          variant: 'destructive',
        });
        setDurationSeconds(undefined);
        event.target.value = '';
        return;
      }
      setDurationSeconds(selectedDuration);
    } else {
      setDurationSeconds(undefined);
    }
    setFile(next);
  };

  const onThumbnailPick = (picked: File | null) => {
    if (picked && picked.size > MAX_THUMBNAIL_BYTES) {
      toast({
        title: t('professorDashboard.videos.thumbnailTooLarge', 'Thumbnail must be 5 MB or smaller.'),
        variant: 'destructive',
      });
      return;
    }
    setThumbnailFile(picked);
    if (thumbnailInputRef.current && !picked) thumbnailInputRef.current.value = '';
  };

  const resetUploadForm = () => {
    setTitle('');
    setFile(null);
    setDurationSeconds(undefined);
    setThumbnailFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
  };

  const submitUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle || !file) return;

    setUploading(true);
    try {
      const [videoUrl, thumbnailUrl] = await Promise.all([
        uploadPromotionalVideoFile(file),
        thumbnailFile ? uploadPromotionalVideoThumbnail(thumbnailFile) : Promise.resolve(undefined),
      ]);
      await savePromotionalVideo({
        title: trimmedTitle,
        videoUrl,
        thumbnailUrl,
        sortOrder: videos.length,
        durationSeconds,
      });
      toast({ title: t('professorDashboard.videos.uploadSuccess', 'Video uploaded') });
      resetUploadForm();
      await load();
    } catch (error) {
      toast({
        title: getApiErrorMessage(error, t('professorDashboard.videos.uploadError', 'Upload failed')),
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {t('professorDashboard.videos.pageTitle', isRtl ? 'ویدیوهای تبلیغاتی' : 'Promotional videos')}
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {t(
            'professorDashboard.videos.pageDescription',
            isRtl
              ? 'ویدیوهای معرفی خود را آپلود کنید. پس از تأیید پروفایل، ویدیوها در صفحه تبلیغات شما نمایش داده می‌شوند.'
              : 'Upload intro videos. Once your profile is approved, videos appear on your public advertisement page.'
          )}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('professorDashboard.videos.uploadTitle', 'Upload video')}</CardTitle>
          <CardDescription>
            {t(
              'professorDashboard.videos.uploadHint',
              isRtl
                ? 'فرمت‌های MP4، WebM، MOV، AVI یا MKV — حداکثر ۵۰ مگابایت. تصویر کاور اختیاری است.'
                : 'MP4, WebM, MOV, AVI, or MKV — max 50 MB. Cover image is optional.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void submitUpload(e)} className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="promo-video-title">{t('professorDashboard.videos.titleLabel', 'Title')}</Label>
                <Input
                  id="promo-video-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('professorDashboard.videos.titlePlaceholder', 'Video title')}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promo-video-file">{t('professorDashboard.videos.fileLabel', 'Video file')}</Label>
                <Input
                  id="promo-video-file"
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska,.mp4,.webm,.mov,.avi,.mkv"
                  onChange={(event) => void onFileChange(event)}
                  required
                />
              </div>
              <ThumbnailPicker
                id="promo-video-thumbnail"
                label={t('professorDashboard.videos.thumbnailLabel', 'Cover image')}
                hint={t(
                  'professorDashboard.videos.thumbnailHint',
                  isRtl ? 'JPG، PNG یا WebP — حداکثر ۵ مگابایت' : 'JPG, PNG, or WebP — max 5 MB'
                )}
                previewUrl={thumbnailPreview}
                onFile={onThumbnailPick}
                disabled={uploading}
              />
              <Button type="submit" disabled={uploading || !file || !title.trim()} className="gap-2">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {t('professorDashboard.videos.uploadButton', 'Upload')}
              </Button>
            </div>

            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="mb-3 text-sm font-medium text-muted-foreground">
                {t('professorDashboard.videos.previewLabel', 'Preview')}
              </p>
              <PromotionalVideoPlayer
                videoUrl={videoPreviewUrl ?? ''}
                thumbnailUrl={thumbnailPreview}
                title={title || t('professorDashboard.videos.titlePlaceholder', 'Video title')}
                className={cn(!file && !thumbnailPreview && 'opacity-60')}
              />
              {file ? (
                <p className="mt-2 truncate text-xs text-muted-foreground">{file.name}</p>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  {t('professorDashboard.videos.previewHint', 'Select a video and cover to see how it will look.')}
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold md:text-xl">
            {t('professorDashboard.videos.listTitle', 'Your videos')}
          </h2>
          {!loading && videos.length > 0 ? (
            <span className="text-sm text-muted-foreground">
              {videos.length} {t('professorDashboard.videos.countLabel', isRtl ? 'ویدیو' : 'videos')}
            </span>
          ) : null}
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            <Skeleton className="aspect-[4/5] w-full rounded-xl" />
            <Skeleton className="aspect-[4/5] w-full rounded-xl" />
          </div>
        ) : videos.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
              <Upload className="h-10 w-10 opacity-30" />
              <p>{t('professorDashboard.videos.empty', 'No videos yet. Upload your first promotional video above.')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {videos.map((video) => (
              <SavedVideoCard key={video.id} video={video} t={t} onChanged={() => void load()} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
