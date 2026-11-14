'use client';

import * as React from 'react';
import { ImageIcon, Loader2, Upload } from 'lucide-react';
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
import { MediaPickerDialog } from '@/components/media/MediaPickerDialog';
import { useLanguage } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import { resolveStaticAssetUrl, toSameOriginAssetSrc } from '@/lib/apiClient';
import {
  saveArkaPromotionalVideo,
  uploadArkaPromotionalVideo,
  uploadArkaPromotionalVideoThumbnail,
  type ArkaPromotionalVideoItem,
} from '@/services/arka-content-api.service';
import { getMediaUploadSettings } from '@/services/media-upload-settings-api.service';

type Props = {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  video: ArkaPromotionalVideoItem | null;
  onSuccessAction: () => void;
  teacherUserId?: string;
};

const EMPTY_FORM = {
  title: '',
  videoUrl: '',
  thumbnailUrl: '',
  sortOrder: '0',
};

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

export function AddArkaVideoModal({ open, onOpenChangeAction, video, onSuccessAction, teacherUserId }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [saving, setSaving] = React.useState(false);
  const [uploadingVideo, setUploadingVideo] = React.useState(false);
  const [uploadingThumb, setUploadingThumb] = React.useState(false);
  const [thumbPickerOpen, setThumbPickerOpen] = React.useState(false);
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [promotionalMaxMinutes, setPromotionalMaxMinutes] = React.useState(5);
  const [durationSeconds, setDurationSeconds] = React.useState<number | undefined>();
  const videoInputRef = React.useRef<HTMLInputElement>(null);
  const thumbInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) return;
    if (video) {
      setForm({
        title: video.title,
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl ?? '',
        sortOrder: String(video.sortOrder ?? 0),
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setDurationSeconds(undefined);
  }, [open, video]);

  React.useEffect(() => {
    void getMediaUploadSettings()
      .then((settings) => setPromotionalMaxMinutes(settings.promotionalVideoMaxDurationMinutes || 5))
      .catch(() => setPromotionalMaxMinutes(5));
  }, []);

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: t('arka_videos_title_required'), variant: 'destructive' });
      return;
    }
    if (!form.videoUrl.trim()) {
      toast({ title: t('arka_videos_file_required'), variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await saveArkaPromotionalVideo({
        videoId: video?.id,
        title: form.title.trim(),
        videoUrl: form.videoUrl.trim(),
        thumbnailUrl: form.thumbnailUrl.trim() || undefined,
        sortOrder: Number(form.sortOrder) || 0,
        durationSeconds,
      }, (() => {
        const ownerUserId = teacherUserId ?? (video?.teacherUserId ? String(video.teacherUserId) : undefined);
        return ownerUserId ? { teacherUserId: ownerUserId } : undefined;
      })());
      toast({ title: t('arka_videos_saved') });
      onOpenChangeAction(false);
      onSuccessAction();
    } catch {
      toast({ title: t('arka_videos_save_failed'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleVideoUpload = async (file: File) => {
    const selectedDuration = await readVideoDuration(file);
    if (selectedDuration > promotionalMaxMinutes * 60) {
      toast({
        title: t('addCourse_video_error', { minutes: promotionalMaxMinutes }),
        variant: 'destructive',
      });
      setDurationSeconds(undefined);
      return;
    }
    setDurationSeconds(selectedDuration);
    setUploadingVideo(true);
    try {
      const url = await uploadArkaPromotionalVideo(file);
      setForm((f) => ({ ...f, videoUrl: url }));
      toast({ title: t('arka_content_upload_success') });
    } catch {
      toast({ title: t('arka_content_upload_failed'), variant: 'destructive' });
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleThumbUpload = async (file: File) => {
    setUploadingThumb(true);
    try {
      const url = await uploadArkaPromotionalVideoThumbnail(file);
      setForm((f) => ({ ...f, thumbnailUrl: url }));
      toast({ title: t('arka_content_upload_success') });
    } catch {
      toast({ title: t('arka_content_upload_failed'), variant: 'destructive' });
    } finally {
      setUploadingThumb(false);
    }
  };

  const thumbPreview = form.thumbnailUrl
    ? (toSameOriginAssetSrc(form.thumbnailUrl) ?? resolveStaticAssetUrl(form.thumbnailUrl))
    : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChangeAction}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{video ? t('arka_videos_modal_edit') : t('arka_videos_modal_add')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t('arka_videos_field_title')}</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{t('arka_videos_field_video')}</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  disabled={uploadingVideo}
                  onClick={() => videoInputRef.current?.click()}
                >
                  {uploadingVideo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {t('arka_content_upload_file')}
                </Button>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleVideoUpload(file);
                    e.target.value = '';
                  }}
                />
              </div>
              {form.videoUrl ? (
                <p className="truncate text-xs text-muted-foreground">{form.videoUrl}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>{t('arka_videos_field_thumbnail')}</Label>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" className="gap-2" onClick={() => setThumbPickerOpen(true)}>
                  <ImageIcon className="h-4 w-4" />
                  {t('arka_content_pick_media')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  disabled={uploadingThumb}
                  onClick={() => thumbInputRef.current?.click()}
                >
                  {uploadingThumb ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {t('arka_content_upload_file')}
                </Button>
                <input
                  ref={thumbInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleThumbUpload(file);
                    e.target.value = '';
                  }}
                />
              </div>
              {thumbPreview ? (
                <div className="mt-2 h-24 w-40 overflow-hidden rounded border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumbPreview} alt="" className="h-full w-full object-cover" />
                </div>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>{t('arka_videos_field_sort')}</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChangeAction(false)} disabled={saving}>
              {t('arka_content_cancel')}
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving}>
              {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
              {t('arka_content_save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MediaPickerDialog
        open={thumbPickerOpen}
        onOpenChange={setThumbPickerOpen}
        acceptTypes={['image']}
        isAdmin
        onSelect={(item) => {
          setForm((f) => ({ ...f, thumbnailUrl: item.fileUrl }));
          setThumbPickerOpen(false);
        }}
      />
    </>
  );
}
