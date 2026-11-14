'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import {
  BookOpen,
  CheckCircle2,
  Eye,
  FileText,
  Film,
  Loader2,
  Megaphone,
  Newspaper,
  Package,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  UserX,
  XCircle,
} from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ReviewChangesPanel, type TeacherReviewChanges } from '@/components/review-changes/review-changes-panel';
import {
  extractPreviewFromReviewChanges,
  TeacherContentPreview,
} from './teacher-content-preview';
import { formatLocalizedDateTime } from '@/lib/utils/localized-ui';
import { cn } from '@/lib/utils';
import * as teacherApi from '@/services/teacher-service';

type ContentTypeKey =
  | 'advertisement'
  | 'video'
  | 'book'
  | 'software'
  | 'portfolio_article'
  | 'article'
  | 'resume';

const CONTENT_ICONS: Record<ContentTypeKey, React.ElementType> = {
  advertisement: Megaphone,
  video: Film,
  book: BookOpen,
  software: Package,
  portfolio_article: FileText,
  article: Newspaper,
  resume: FileText,
};

export function TeacherContentModerationClient() {
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const focusTeacherId = Number(searchParams.get('teacherId') || 0);
  const [items, setItems] = React.useState<teacherApi.PendingTeacherContentDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [actingKey, setActingKey] = React.useState<string | null>(null);
  const [rejectNote, setRejectNote] = React.useState<Record<string, string>>({});
  const [teacherIdInput, setTeacherIdInput] = React.useState('');
  const [accountNote, setAccountNote] = React.useState('');
  const [accountActing, setAccountActing] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<teacherApi.PendingTeacherContentDto | null>(null);
  const [reviewChanges, setReviewChanges] = React.useState<TeacherReviewChanges | null>(null);
  const [reviewLoading, setReviewLoading] = React.useState(false);

  const reviewFieldLabel = (fieldKey: string, fallback: string) => {
    const key = `teacher_review_field_${fieldKey}` as const;
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  const openReview = async (item: teacherApi.PendingTeacherContentDto) => {
    setSelectedItem(item);
    setReviewChanges(null);
    setReviewLoading(true);
    try {
      const changes = await teacherApi.getTeacherReviewChanges({
        reviewType: item.contentType,
        teacherId: item.contentType === 'advertisement' ? item.teacherId : item.teacherId,
        contentId: item.contentId,
      });
      setReviewChanges(changes);
    } catch {
      toast({ title: t('teacher_content_review_load_failed'), variant: 'destructive' });
      setSelectedItem(null);
    } finally {
      setReviewLoading(false);
    }
  };

  const closeReview = () => {
    setSelectedItem(null);
    setReviewChanges(null);
  };

  const resolvePreview = (item: teacherApi.PendingTeacherContentDto) => {
    const fromChanges = extractPreviewFromReviewChanges(reviewChanges?.changes);
    return {
      previewUrl: fromChanges.previewUrl ?? item.previewUrl,
      thumbnailUrl: fromChanges.thumbnailUrl ?? item.thumbnailUrl,
      coverImageUrl: fromChanges.coverImageUrl ?? item.coverImageUrl,
    };
  };

  const contentLabel = (type: string) => {
    const key = `teacher_content_type_${type}` as const;
    const translated = t(key);
    return translated === key ? type : translated;
  };

  const load = React.useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      setItems(await teacherApi.getPendingTeacherContent());
    } catch {
      toast({ title: t('teacher_content_load_failed'), variant: 'destructive' });
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t, toast]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const visibleItems = React.useMemo(() => {
    if (!focusTeacherId) return items;
    return [...items].sort((a, b) => {
      if (a.teacherId === focusTeacherId) return -1;
      if (b.teacherId === focusTeacherId) return 1;
      return 0;
    });
  }, [focusTeacherId, items]);

  const review = async (item: teacherApi.PendingTeacherContentDto, approve: boolean) => {
    const key = `${item.contentType}-${item.contentId}`;
    if (!approve && !rejectNote[key]?.trim()) {
      toast({ title: t('teacher_content_rejection_required'), variant: 'destructive' });
      return;
    }
    setActingKey(key);
    try {
      await teacherApi.reviewTeacherContent({
        contentType: item.contentType,
        contentId: item.contentId,
        approve,
        rejectionNote: rejectNote[key],
      });
      toast({ title: approve ? t('teacher_content_approved_toast') : t('teacher_content_rejected_toast') });
      closeReview();
      await load(true);
    } catch {
      toast({ title: t('teacher_content_action_failed'), variant: 'destructive' });
    } finally {
      setActingKey(null);
    }
  };

  const setAccountStatus = async (status: 'active' | 'blocked' | 'terminated') => {
    const teacherId = Number(teacherIdInput);
    if (!teacherId) {
      toast({ title: t('teacher_content_invalid_teacher_id'), variant: 'destructive' });
      return;
    }
    if (status === 'terminated' && !accountNote.trim()) {
      toast({ title: t('teacher_content_termination_note_required'), variant: 'destructive' });
      return;
    }
    setAccountActing(true);
    try {
      await teacherApi.setTeacherAccountStatus({
        teacherId,
        status,
        note: accountNote.trim() || undefined,
      });
      toast({ title: t(`teacher_content_account_status_${status}`) });
      setAccountNote('');
    } catch {
      toast({ title: t('teacher_content_account_update_failed'), variant: 'destructive' });
    } finally {
      setAccountActing(false);
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
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('teacher_content_title')}</h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{t('teacher_content_description')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start">
          {!loading && (
            <Badge variant="secondary" className="px-3 py-1 text-sm">
              {t('teacher_content_pending_count', { count: String(items.length) })}
            </Badge>
          )}
          <Button variant="outline" size="sm" disabled={loading || refreshing} onClick={() => void load(true)}>
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ms-2">{t('refresh')}</span>
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-amber-200/60 dark:border-amber-900/40">
        <CardHeader className="border-b bg-amber-50/50 dark:bg-amber-950/20">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400" />
            <div>
              <CardTitle>{t('teacher_content_account_actions_title')}</CardTitle>
              <CardDescription>{t('teacher_content_account_actions_desc')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5 pt-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="teacherId">{t('teacher_content_teacher_id')}</Label>
            <Input
              id="teacherId"
              dir="ltr"
              value={teacherIdInput}
              onChange={(e) => setTeacherIdInput(e.target.value)}
              placeholder={t('teacher_content_teacher_id_placeholder')}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="accountNote">{t('teacher_content_account_note')}</Label>
            <Textarea
              id="accountNote"
              rows={3}
              value={accountNote}
              onChange={(e) => setAccountNote(e.target.value)}
              placeholder={t('teacher_content_account_note_placeholder')}
            />
          </div>
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Button disabled={accountActing} variant="outline" onClick={() => void setAccountStatus('blocked')}>
              {accountActing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
              <span className="ms-2">{t('teacher_content_block')}</span>
            </Button>
            <Button disabled={accountActing} variant="destructive" onClick={() => void setAccountStatus('terminated')}>
              {accountActing ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
              <span className="ms-2">{t('teacher_content_terminate')}</span>
            </Button>
            <Button disabled={accountActing} onClick={() => void setAccountStatus('active')}>
              {accountActing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              <span className="ms-2">{t('teacher_content_restore')}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-4 text-lg font-semibold">{t('teacher_content_queue_title')}</h2>

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
                <ShieldCheck className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">{t('teacher_content_empty_title')}</h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">{t('teacher_content_empty_desc')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {visibleItems.map((item) => {
              const key = `${item.contentType}-${item.contentId}`;
              const busy = actingKey === key;
              const typeKey = item.contentType as ContentTypeKey;
              const Icon = CONTENT_ICONS[typeKey] ?? FileText;
              const isFocused = focusTeacherId > 0 && item.teacherId === focusTeacherId;

              return (
                <Card
                  key={key}
                  className={cn(
                    'overflow-hidden transition-shadow hover:shadow-md',
                    isFocused && 'ring-2 ring-primary/60'
                  )}
                >
                  <CardHeader className="border-b bg-muted/20 pb-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="mb-2 flex flex-wrap gap-2">
                            <Badge>{contentLabel(item.contentType)}</Badge>
                            <Badge variant="outline">
                              {t('teacher_content_teacher_badge', { id: String(item.teacherId) })}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg leading-snug">{item.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {item.teacherDisplayName} · @{item.teacherUserName}
                          </CardDescription>
                        </div>
                      </div>
                      {item.submittedAtUtc ? (
                        <p className="text-xs text-muted-foreground lg:text-end">
                          {t('teacher_content_submitted_at')}: {formatLocalizedDateTime(item.submittedAtUtc, locale, t)}
                        </p>
                      ) : null}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    {(item.contentType === 'video' && item.previewUrl) ||
                    (item.contentType === 'book' && item.coverImageUrl) ? (
                      <TeacherContentPreview
                        contentType={item.contentType}
                        previewUrl={item.previewUrl}
                        thumbnailUrl={item.thumbnailUrl}
                        coverImageUrl={item.coverImageUrl}
                        title={item.title}
                        className="max-w-xl"
                      />
                    ) : null}
                    {item.summary ? (
                      <Alert>
                        <AlertTitle>{t('teacher_content_summary')}</AlertTitle>
                        <AlertDescription
                          className={cn(
                            'whitespace-pre-wrap',
                            item.contentType === 'advertisement'
                              ? 'max-h-64 overflow-y-auto'
                              : 'line-clamp-4'
                          )}
                        >
                          {item.summary}
                        </AlertDescription>
                      </Alert>
                    ) : null}
                    <Separator />
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" disabled={busy} onClick={() => void openReview(item)}>
                        <Eye className="h-4 w-4" />
                        <span className="ms-2">{t('teacher_content_view_changes')}</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={selectedItem != null} onOpenChange={(open) => !open && closeReview()}>
        <DialogContent className="flex max-h-[min(92vh,920px)] w-[min(96vw,48rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
          <DialogHeader className="shrink-0 space-y-1 border-b bg-muted/20 px-6 py-5 text-start">
            <DialogTitle>{t('teacher_content_review_modal_title')}</DialogTitle>
            <DialogDescription>
              {selectedItem
                ? `${contentLabel(selectedItem.contentType)} · ${selectedItem.title}`
                : t('teacher_content_description')}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {reviewLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <>
                {selectedItem ? (
                  <TeacherContentPreview
                    contentType={selectedItem.contentType}
                    {...resolvePreview(selectedItem)}
                    title={selectedItem.title}
                    className="mb-4 max-w-2xl"
                  />
                ) : null}
                <ReviewChangesPanel
                  changes={reviewChanges}
                  loading={reviewLoading}
                  emptyLabel={t('teacher_review_no_changes')}
                  newContentLabel={t('teacher_review_new_content')}
                  noBaselineLabel={t('teacher_review_first_submission')}
                  changesTitle={t('teacher_review_changes_title')}
                  fieldLabel={reviewFieldLabel}
                />
                {selectedItem?.summary ? (
                  <Alert className="mt-4">
                    <AlertTitle>{t('teacher_content_current_summary')}</AlertTitle>
                    <AlertDescription className="max-h-80 overflow-y-auto whitespace-pre-wrap">
                      {selectedItem.summary}
                    </AlertDescription>
                  </Alert>
                ) : null}
              </>
            )}
          </div>

          <div className="shrink-0 space-y-4 border-t bg-muted/20 px-6 py-4">
            {selectedItem ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="content-rejection-note">{t('teacher_content_rejection_note')}</Label>
                  <p className="text-xs text-muted-foreground">{t('teacher_content_rejection_hint')}</p>
                  <Textarea
                    id="content-rejection-note"
                    rows={2}
                    placeholder={t('teacher_content_rejection_placeholder')}
                    value={rejectNote[`${selectedItem.contentType}-${selectedItem.contentId}`] ?? ''}
                    onChange={(e) =>
                      setRejectNote((prev) => ({
                        ...prev,
                        [`${selectedItem.contentType}-${selectedItem.contentId}`]: e.target.value,
                      }))
                    }
                  />
                </div>
                <DialogFooter className="gap-2 p-0 sm:justify-end">
                  <Button variant="ghost" onClick={closeReview}>
                    {t('teacher_approvals_close')}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={actingKey === `${selectedItem.contentType}-${selectedItem.contentId}`}
                    onClick={() => void review(selectedItem, false)}
                  >
                    {actingKey === `${selectedItem.contentType}-${selectedItem.contentId}` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <span className="ms-2">{t('teacher_content_reject')}</span>
                  </Button>
                  <Button
                    disabled={actingKey === `${selectedItem.contentType}-${selectedItem.contentId}`}
                    onClick={() => void review(selectedItem, true)}
                  >
                    {actingKey === `${selectedItem.contentType}-${selectedItem.contentId}` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    <span className="ms-2">{t('teacher_content_approve')}</span>
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
