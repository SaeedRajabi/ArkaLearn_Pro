'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  publishTeacherStory,
  uploadTeacherStoryMedia,
  type TeacherStoryMediaKind,
} from '@/lib/api/support-chat';
import { useToast } from '@/hooks/use-toast';

type TeacherStoryPublisherProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPublished?: () => void;
};

export function TeacherStoryPublisher({ open, onOpenChange, onPublished }: TeacherStoryPublisherProps) {
  const { toast } = useToast();
  const [caption, setCaption] = React.useState('');
  const [mediaUrl, setMediaUrl] = React.useState<string | null>(null);
  const [mediaKind, setMediaKind] = React.useState<TeacherStoryMediaKind>(0);
  const [durationSeconds, setDurationSeconds] = React.useState(5);
  const [uploading, setUploading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setCaption('');
      setMediaUrl(null);
      setMediaKind(0);
      setDurationSeconds(5);
    }
  }, [open]);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const isVideo = file.type.startsWith('video/');
      const uploaded = await uploadTeacherStoryMedia(file, isVideo ? 'video' : 'image');
      setMediaUrl(uploaded.url);
      setMediaKind(uploaded.mediaKind);
      setDurationSeconds(isVideo ? 30 : 5);
    } catch {
      toast({ variant: 'destructive', title: 'آپلود ناموفق بود' });
    } finally {
      setUploading(false);
    }
  };

  const handlePublish = async () => {
    if (!caption.trim() && !mediaUrl) {
      toast({ variant: 'destructive', title: 'متن یا رسانه الزامی است' });
      return;
    }
    setSaving(true);
    try {
      await publishTeacherStory({
        caption: caption.trim(),
        mediaUrl,
        mediaKind,
        durationSeconds: mediaKind === 2 ? Math.min(60, Math.max(1, durationSeconds)) : durationSeconds,
      });
      toast({ title: 'استوری منتشر شد' });
      onOpenChange(false);
      onPublished?.();
    } catch {
      toast({ variant: 'destructive', title: 'انتشار استوری ناموفق بود' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>انتشار استوری</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>متن / خبر</Label>
            <Textarea
              rows={4}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="مثلاً: فردا هر کس در دوره ثبت‌نام کند ۱۰٪ تخفیف می‌گیرد"
            />
          </div>
          <div className="space-y-2">
            <Label>عکس یا ویدیو کوتاه</Label>
            <Input
              type="file"
              accept="image/*,video/mp4,video/webm,video/quicktime"
              onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
              disabled={uploading || saving}
            />
            {uploading ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> در حال آپلود…
              </p>
            ) : null}
            {mediaUrl ? (
              <p className="truncate text-xs text-muted-foreground" dir="ltr">
                {mediaUrl}
              </p>
            ) : null}
          </div>
          {mediaKind === 2 ? (
            <div className="space-y-2">
              <Label>مدت ویدیو (ثانیه، حداکثر ۶۰)</Label>
              <Input
                type="number"
                min={1}
                max={60}
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(Number(e.target.value) || 30)}
              />
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button type="button" onClick={() => void handlePublish()} disabled={saving || uploading}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'انتشار'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
