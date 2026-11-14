'use client';

import * as React from 'react';
import {
  BookOpen,
  CheckCircle2,
  Film,
  GraduationCap,
  Loader2,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { TeacherContentPreview } from '@/app/dashboard/teacher-content-moderation/components/teacher-content-preview';
import { formatLocalizedDateTime } from '@/lib/utils/localized-ui';
import * as courseApi from '@/services/course-service';

type ItemTypeKey = 'course' | 'lesson_video';

const ITEM_ICONS: Record<ItemTypeKey, React.ElementType> = {
  course: GraduationCap,
  lesson_video: Film,
};

function itemKey(item: courseApi.PendingCourseModerationDto) {
  return `${item.itemType}-${item.courseId}-${item.lessonId ?? 0}`;
}

export function CourseModerationClient() {
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const [items, setItems] = React.useState<courseApi.PendingCourseModerationDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [actingKey, setActingKey] = React.useState<string | null>(null);
  const [rejectNote, setRejectNote] = React.useState<Record<string, string>>({});
  const [selectedItem, setSelectedItem] = React.useState<courseApi.PendingCourseModerationDto | null>(null);

  const itemLabel = (type: string) => {
    const key = `course_moderation_type_${type}` as const;
    const translated = t(key);
    return translated === key ? type : translated;
  };

  const load = React.useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      setItems(await courseApi.getPendingCourseModeration());
    } catch {
      toast({ title: t('course_moderation_load_failed'), variant: 'destructive' });
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t, toast]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const review = async (item: courseApi.PendingCourseModerationDto, approve: boolean) => {
    const key = itemKey(item);
    if (!approve && !rejectNote[key]?.trim()) {
      toast({ title: t('course_moderation_rejection_required'), variant: 'destructive' });
      return;
    }
    setActingKey(key);
    try {
      await courseApi.reviewCourseModeration({
        itemType: item.itemType,
        courseId: item.courseId,
        lessonId: item.lessonId,
        approve,
        rejectionNote: rejectNote[key],
      });
      toast({ title: approve ? t('course_moderation_approved_toast') : t('course_moderation_rejected_toast') });
      setSelectedItem(null);
      await load(true);
    } catch {
      toast({ title: t('course_moderation_action_failed'), variant: 'destructive' });
    } finally {
      setActingKey(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('course_moderation_title')}</h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{t('course_moderation_description')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start">
          {!loading && (
            <Badge variant="secondary" className="px-3 py-1 text-sm">
              {t('course_moderation_pending_count', { count: String(items.length) })}
            </Badge>
          )}
          <Button variant="outline" size="sm" disabled={loading || refreshing} onClick={() => void load(true)}>
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ms-2">{t('refresh')}</span>
          </Button>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">{t('course_moderation_queue_title')}</h2>

        {loading ? (
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-6 w-64" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : items.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">{t('course_moderation_empty_title')}</h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">{t('course_moderation_empty_desc')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {items.map((item) => {
              const key = itemKey(item);
              const busy = actingKey === key;
              const typeKey = item.itemType as ItemTypeKey;
              const Icon = ITEM_ICONS[typeKey] ?? GraduationCap;

              return (
                <Card key={key} className="overflow-hidden transition-shadow hover:shadow-md">
                  <CardHeader className="border-b bg-muted/20 pb-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="mb-2 flex flex-wrap gap-2">
                            <Badge>{itemLabel(item.itemType)}</Badge>
                            <Badge variant="outline">
                              {t('course_moderation_teacher_badge', { id: String(item.teacherId) })}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg leading-snug">{item.title}</CardTitle>
                          {item.itemType === 'lesson_video' && item.courseTitle ? (
                            <CardDescription className="mt-1">
                              {t('course_moderation_parent_course', { title: item.courseTitle })}
                            </CardDescription>
                          ) : null}
                          <CardDescription className="mt-1">
                            {item.teacherDisplayName} · @{item.teacherUserName}
                          </CardDescription>
                        </div>
                      </div>
                      {item.submittedAtUtc ? (
                        <p className="text-xs text-muted-foreground lg:text-end">
                          {t('course_moderation_submitted_at')}:{' '}
                          {formatLocalizedDateTime(item.submittedAtUtc, locale, t)}
                        </p>
                      ) : null}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    {item.itemType === 'lesson_video' && item.previewUrl ? (
                      <TeacherContentPreview
                        contentType="video"
                        previewUrl={item.previewUrl}
                        thumbnailUrl={item.thumbnailUrl}
                        title={item.title}
                        className="max-w-xl"
                      />
                    ) : item.thumbnailUrl ? (
                      <TeacherContentPreview
                        contentType="book"
                        coverImageUrl={item.thumbnailUrl}
                        title={item.title}
                        className="max-w-xs"
                      />
                    ) : null}
                    <Separator />
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" disabled={busy} onClick={() => setSelectedItem(item)}>
                        {t('course_moderation_review')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={selectedItem != null} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="flex max-h-[min(92vh,920px)] w-[min(96vw,48rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
          <DialogHeader className="shrink-0 space-y-1 border-b bg-muted/20 px-6 py-5 text-start">
            <DialogTitle>{t('course_moderation_modal_title')}</DialogTitle>
            <DialogDescription>
              {selectedItem
                ? `${itemLabel(selectedItem.itemType)} · ${selectedItem.title}`
                : t('course_moderation_description')}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {selectedItem?.itemType === 'lesson_video' && selectedItem.previewUrl ? (
              <TeacherContentPreview
                contentType="video"
                previewUrl={selectedItem.previewUrl}
                thumbnailUrl={selectedItem.thumbnailUrl}
                title={selectedItem.title}
                className="mb-4 max-w-2xl"
              />
            ) : selectedItem?.thumbnailUrl ? (
              <TeacherContentPreview
                contentType="book"
                coverImageUrl={selectedItem.thumbnailUrl}
                title={selectedItem.title}
                className="mb-4 max-w-sm"
              />
            ) : null}
            {selectedItem?.itemType === 'lesson_video' && selectedItem.courseTitle ? (
              <p className="text-sm text-muted-foreground">
                {t('course_moderation_parent_course', { title: selectedItem.courseTitle })}
              </p>
            ) : null}
          </div>

          <div className="shrink-0 space-y-4 border-t bg-muted/20 px-6 py-4">
            {selectedItem ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="course-rejection-note">{t('course_moderation_rejection_note')}</Label>
                  <p className="text-xs text-muted-foreground">{t('course_moderation_rejection_hint')}</p>
                  <Textarea
                    id="course-rejection-note"
                    rows={2}
                    placeholder={t('course_moderation_rejection_placeholder')}
                    value={rejectNote[itemKey(selectedItem)] ?? ''}
                    onChange={(e) =>
                      setRejectNote((prev) => ({
                        ...prev,
                        [itemKey(selectedItem)]: e.target.value,
                      }))
                    }
                  />
                </div>
                <DialogFooter className="gap-2 p-0 sm:justify-end">
                  <Button variant="ghost" onClick={() => setSelectedItem(null)}>
                    {t('teacher_approvals_close')}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={actingKey === itemKey(selectedItem)}
                    onClick={() => void review(selectedItem, false)}
                  >
                    {actingKey === itemKey(selectedItem) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <span className="ms-2">{t('course_moderation_reject')}</span>
                  </Button>
                  <Button
                    disabled={actingKey === itemKey(selectedItem)}
                    onClick={() => void review(selectedItem, true)}
                  >
                    {actingKey === itemKey(selectedItem) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    <span className="ms-2">{t('course_moderation_approve')}</span>
                  </Button>
                </DialogFooter>
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
