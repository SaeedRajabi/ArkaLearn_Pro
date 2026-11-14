'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Check,
  Loader2,
  MessageSquare,
  MessageSquareReply,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { IconSelectPicker } from '@/components/shared/icon-select-picker';
import { searchProfessorCourses } from '@/lib/api/professor-courses';
import {
  approveCourseComment,
  deleteCourseComment,
  getProfessorCourseComments,
  replyToCourseComment,
  type ProfessorCourseComment,
} from '@/lib/api/professor-course-comments';
import { getDictValue } from '@/lib/i18n-client';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/contexts/auth-context';
import { useEngagementHub } from '@/hooks/use-engagement-hub';
import { ENGAGEMENT_SCOPES } from '@/lib/signalr/engagement-hub';
import { cn } from '@/lib/utils';
import type { Dictionary } from '@/types';

type Props = { dict: Dictionary };

function StarRow({ rating }: { rating: number }) {
  if (rating <= 0) return null;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn('h-4 w-4', i < rating ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground/30')}
        />
      ))}
    </div>
  );
}

function ReplyBlock({
  comment,
  isRtl,
  t,
  onReplied,
}: {
  comment: ProfessorCourseComment;
  isRtl: boolean;
  t: (key: string, fb: string) => string;
  onReplied: () => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      await replyToCourseComment({
        courseId: comment.courseId!,
        parentId: comment.id,
        content: trimmed,
      });
      toast({
        title: t('professorDashboard.comments.replySuccess', isRtl ? 'پاسخ ارسال شد' : 'Reply posted'),
      });
      setText('');
      setOpen(false);
      onReplied();
    } catch {
      toast({
        title: t('professorDashboard.comments.replyFailed', isRtl ? 'ارسال پاسخ انجام نشد' : 'Could not post reply'),
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <MessageSquareReply className="h-4 w-4" />
        {t('professorDashboard.comments.reply', isRtl ? 'پاسخ' : 'Reply')}
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('professorDashboard.comments.replyPlaceholder', isRtl ? 'پاسخ خود را بنویسید...' : 'Write your reply...')}
        rows={3}
      />
      <div className="flex gap-2">
        <Button size="sm" disabled={submitting} onClick={() => void submit()}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t('professorDashboard.comments.sendReply', isRtl ? 'ارسال پاسخ' : 'Send reply')}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          {t('professorDashboard.comments.cancel', isRtl ? 'انصراف' : 'Cancel')}
        </Button>
      </div>
    </div>
  );
}

function CommentCard({
  comment,
  isRtl,
  t,
  onChanged,
}: {
  comment: ProfessorCourseComment;
  isRtl: boolean;
  t: (key: string, fb: string) => string;
  onChanged: () => void;
}) {
  const { toast } = useToast();
  const [busy, setBusy] = React.useState(false);
  const author = comment.author?.fullName?.trim() || comment.author?.userName?.trim() || 'User';

  const setApproval = async (isApproved: boolean) => {
    setBusy(true);
    try {
      await approveCourseComment({
        courseId: comment.courseId!,
        commentId: comment.id,
        isApproved,
      });
      toast({
        title: isApproved
          ? t('professorDashboard.comments.approved', isRtl ? 'نظر تأیید شد' : 'Review approved')
          : t('professorDashboard.comments.rejected', isRtl ? 'نظر رد شد' : 'Review rejected'),
      });
      onChanged();
    } catch {
      toast({
        title: t('professorDashboard.comments.actionFailed', isRtl ? 'عملیات انجام نشد' : 'Action failed'),
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await deleteCourseComment({ courseId: comment.courseId!, commentId: comment.id });
      toast({
        title: t('professorDashboard.comments.deleted', isRtl ? 'نظر حذف شد' : 'Review deleted'),
      });
      onChanged();
    } catch {
      toast({
        title: t('professorDashboard.comments.actionFailed', isRtl ? 'عملیات انجام نشد' : 'Action failed'),
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <Avatar className="h-11 w-11">
            <AvatarImage src={comment.author?.avatarUrl || undefined} />
            <AvatarFallback>{author.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{author}</p>
            <p className="text-xs text-muted-foreground">{comment.timeStamp}</p>
            <Link href={`/professor/courses/${comment.courseId}`} className="mt-1 inline-block text-sm text-primary hover:underline">
              {comment.courseTitle}
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StarRow rating={comment.rating} />
          <Badge variant={comment.isApproved ? 'default' : 'secondary'}>
            {comment.isApproved
              ? t('professorDashboard.comments.statusApproved', isRtl ? 'عمومی' : 'Public')
              : t('professorDashboard.comments.statusPending', isRtl ? 'در انتظار' : 'Pending')}
          </Badge>
        </div>
      </div>

      <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{comment.text}</p>

      {comment.replies && comment.replies.length > 0 ? (
        <div className="mt-4 space-y-3 border-s-2 border-primary/20 ps-4">
          {comment.replies.map((reply) => {
            const replyAuthor = reply.author?.fullName?.trim() || reply.author?.userName?.trim() || 'User';
            return (
              <div key={reply.id} className="rounded-xl bg-muted/40 p-3">
                <p className="text-sm font-medium">{replyAuthor}</p>
                <p className="mt-1 text-xs text-muted-foreground">{reply.timeStamp}</p>
                <p className="mt-2 text-sm text-muted-foreground">{reply.text}</p>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {!comment.isApproved ? (
          <Button size="sm" disabled={busy} onClick={() => void setApproval(true)}>
            <Check className="h-4 w-4" />
            {t('professorDashboard.comments.approve', isRtl ? 'تأیید و انتشار' : 'Approve')}
          </Button>
        ) : (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => void setApproval(false)}>
            <X className="h-4 w-4" />
            {t('professorDashboard.comments.unapprove', isRtl ? 'لغو انتشار' : 'Unpublish')}
          </Button>
        )}
        <ReplyBlock comment={comment} isRtl={isRtl} t={t} onReplied={onChanged} />
        <Button size="sm" variant="destructive" disabled={busy} onClick={() => void remove()}>
          <Trash2 className="h-4 w-4" />
          {t('professorDashboard.comments.delete', isRtl ? 'حذف' : 'Delete')}
        </Button>
      </div>
    </div>
  );
}

export function ProfessorCommentsPageClient({ dict }: Props) {
  const { locale } = useLanguage();
  const { user } = useAuth();
  const isRtl = locale === 'fa';
  const t = (key: string, fb: string) => getDictValue(dict, key, fb);

  const [comments, setComments] = React.useState<ProfessorCourseComment[]>([]);
  const [courses, setCourses] = React.useState<{ value: string; label: string }[]>([]);
  const [courseFilter, setCourseFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'pending' | 'approved'>('all');
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const onlyPending = statusFilter === 'pending' ? true : undefined;
      const data = await getProfessorCourseComments({
        courseId: courseFilter ? Number(courseFilter) : undefined,
        onlyPending,
      });
      const filtered =
        statusFilter === 'approved' ? data.filter((c) => c.isApproved) : data;
      setComments(filtered);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [courseFilter, statusFilter]);

  React.useEffect(() => {
    searchProfessorCourses({ pageSize: 100 })
      .then((data) =>
        setCourses(
          data.queryResult.map((c) => ({
            value: String(c.id),
            label: c.title,
          }))
        )
      )
      .catch(() => setCourses([]));
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  useEngagementHub({
    userId: user?.id,
    handlers: {
      onCommentAdded: (payload) => {
        if (payload.scope === ENGAGEMENT_SCOPES.course) {
          void load();
        }
      },
      onNotificationPulse: () => void load(),
    },
  });

  const title = t('professorDashboard.menu.comments', isRtl ? 'دیدگاه‌ها' : 'Comments');
  const subtitle = t(
    'professorDashboard.comments.subtitle',
    isRtl ? 'مدیریت نظرات دانشجویان در دوره‌های شما' : 'Manage student reviews on your courses'
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>{subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <IconSelectPicker
              value={courseFilter}
              onChange={setCourseFilter}
              options={[
                { value: '', label: t('professorDashboard.comments.allCourses', isRtl ? 'همه دوره‌ها' : 'All courses') },
                ...courses,
              ]}
              placeholder={t('professorDashboard.comments.filterCourse', isRtl ? 'فیلتر دوره' : 'Filter by course')}
            />
            <IconSelectPicker
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as 'all' | 'pending' | 'approved')}
              options={[
                { value: 'all', label: t('professorDashboard.comments.allStatuses', isRtl ? 'همه وضعیت‌ها' : 'All statuses') },
                { value: 'pending', label: t('professorDashboard.comments.pendingOnly', isRtl ? 'در انتظار تأیید' : 'Pending only') },
                { value: 'approved', label: t('professorDashboard.comments.approvedOnly', isRtl ? 'منتشر شده' : 'Published only') },
              ]}
              placeholder={t('professorDashboard.comments.filterStatus', isRtl ? 'فیلتر وضعیت' : 'Filter by status')}
            />
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full rounded-2xl" />
              ))}
            </div>
          ) : comments.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {t('professorDashboard.comments.empty', isRtl ? 'نظری برای نمایش وجود ندارد.' : 'No reviews to show.')}
            </p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentCard key={comment.id} comment={comment} isRtl={isRtl} t={t} onChanged={load} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
