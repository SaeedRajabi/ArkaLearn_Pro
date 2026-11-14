'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { MessageSquareReply, Send, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { addArticleComment, getArticleComments } from '@/lib/api/articles';
import type { Article, Dictionary } from '@/types';
import type { ArticleCommentQri } from '@/lib/api/types';
import { useAuth } from '@/contexts/auth-context';
import { useRequireVerifiedEmail } from '@/hooks/use-require-verified-email';
import { useEngagementHub } from '@/hooks/use-engagement-hub';
import { ENGAGEMENT_SCOPES } from '@/lib/signalr/engagement-hub';

type CommentFormProps = {
  dict: Record<string, string>;
  isSubmitting: boolean;
  onSubmit: (content: string, rating: number, parentId?: number | null) => Promise<void>;
  parentId?: number | null;
  onCancel?: () => void;
};

function getAuthorName(comment: ArticleCommentQri, fallback: string) {
  const fullName = comment.author?.fullName?.trim();
  const userName = comment.author?.userName?.trim();

  return fullName || userName || fallback;
}

function normalizeReplies(comment: ArticleCommentQri): ArticleCommentQri[] {
  if (!comment.replies) return [];
  if (Array.isArray(comment.replies)) return comment.replies;
  return comment.replies.$values ?? [];
}

function StarRatingInput({ value, onChange, label }: { value: number; onChange: (value: number) => void; label: string }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{label}</p>
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, index) => {
          const nextValue = index + 1;
          return (
            <button key={nextValue} type="button" onClick={() => onChange(nextValue)} aria-label={`${label} ${nextValue}`}>
              <Star
                className={cn(
                  'h-5 w-5 transition-colors',
                  index < value ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground/30 hover:text-amber-400'
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CommentForm({ dict, isSubmitting, onSubmit, parentId = null, onCancel }: CommentFormProps) {
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(parentId ? 0 : 5);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    await onSubmit(trimmed, parentId ? 0 : rating, parentId);
    setContent('');
    setRating(parentId ? 0 : 5);
    onCancel?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-muted/30 p-4">
      {!parentId && (
        <StarRatingInput
          value={rating}
          onChange={setRating}
          label={dict.yourRating ?? 'Your rating'}
        />
      )}
      <Textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder={dict.commentPlaceholder ?? 'Write your comment...'}
        rows={parentId ? 3 : 5}
        required
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={isSubmitting}>
          <Send className="h-4 w-4" />
          {parentId ? dict.postReply ?? 'Post reply' : dict.submitComment ?? 'Submit comment'}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            {dict.cancel ?? 'Cancel'}
          </Button>
        )}
      </div>
    </form>
  );
}

function CommentItem({
  comment,
  dict,
  isRtl,
  onRequireLogin,
  onReply,
  isSubmitting,
  level = 0,
}: {
  comment: ArticleCommentQri;
  dict: Record<string, string>;
  isRtl: boolean;
  onRequireLogin: () => boolean;
  onReply: (content: string, rating: number, parentId?: number | null) => Promise<void>;
  isSubmitting: boolean;
  level?: number;
}) {
  const [isReplying, setIsReplying] = useState(false);
  const authorName = getAuthorName(comment, dict.anonymousUser ?? 'User');
  const replies = normalizeReplies(comment);

  return (
    <div className={cn('space-y-4', level > 0 && (isRtl ? 'mr-6 border-r pr-4' : 'ml-6 border-l pl-4'))}>
      <div className="flex gap-4 rounded-xl bg-background p-4 shadow-sm">
        <Avatar className="h-11 w-11 shrink-0">
          <AvatarImage src={comment.author?.avatarUrl || undefined} alt={authorName} />
          <AvatarFallback>{authorName.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{authorName}</p>
              <p className="text-xs text-muted-foreground">{comment.timeStamp}</p>
            </div>
            {comment.rating > 0 && (
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className={cn('h-4 w-4', index < comment.rating ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground/30')}
                  />
                ))}
              </div>
            )}
          </div>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">{comment.text}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-3 gap-2"
            onClick={() => {
              if (!onRequireLogin()) return;
              setIsReplying((value) => !value);
            }}
          >
            <MessageSquareReply className="h-4 w-4" />
            {dict.reply ?? 'Reply'}
          </Button>
          {isReplying && (
            <div className="mt-3">
              <CommentForm
                dict={dict}
                isSubmitting={isSubmitting}
                onSubmit={onReply}
                parentId={comment.id}
                onCancel={() => setIsReplying(false)}
              />
            </div>
          )}
        </div>
      </div>

      {replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          dict={dict}
          isRtl={isRtl}
          onRequireLogin={onRequireLogin}
          onReply={onReply}
          isSubmitting={isSubmitting}
          level={level + 1}
        />
      ))}
    </div>
  );
}

export default function ArticleComments({ article, dict }: { article: Article; dict: Dictionary }) {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const { requireVerifiedEmail } = useRequireVerifiedEmail(dict);
  const pageDict = dict.articlesPage as Record<string, string>;
  const isRtl = dict.header.articles !== 'Articles';
  const articleId = Number(article.id);
  const [comments, setComments] = useState<ArticleCommentQri[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectToLogin = useCallback(() => {
    const returnUrl = pathname ? encodeURIComponent(pathname) : '';
    router.push(returnUrl ? `/login?returnUrl=${returnUrl}` : '/login');
  }, [pathname, router]);

  const requireLogin = useCallback(() => {
    if (isLoading) return false;
    if (isAuthenticated) return true;
    redirectToLogin();
    return false;
  }, [isAuthenticated, isLoading, redirectToLogin]);

  const loadComments = useCallback(async () => {
    setIsFetching(true);
    try {
      const result = await getArticleComments(articleId);
      setComments(result.queryResult);
    } catch {
      setComments([]);
    } finally {
      setIsFetching(false);
    }
  }, [articleId]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  useEngagementHub({
    articleId: articleId > 0 ? articleId : undefined,
    handlers: {
      onCommentAdded: (payload) => {
        if (payload.scope === ENGAGEMENT_SCOPES.article && payload.entityId === articleId) {
          void loadComments();
        }
      },
    },
  });

  const submitComment = useCallback(async (content: string, rating: number, parentId?: number | null) => {
    if (!requireLogin()) return;
    if (!requireVerifiedEmail()) return;

    setIsSubmitting(true);
    try {
      await addArticleComment({ articleId, content, rating, parentId });
      toast({
        title: pageDict.commentSubmitted ?? (isRtl ? 'دیدگاه ثبت شد' : 'Comment submitted'),
        description: pageDict.commentPending ?? (isRtl ? 'دیدگاه شما پس از تایید نمایش داده می‌شود.' : 'Your comment will be visible after approval.'),
      });
      await loadComments();
    } catch {
      toast({
        title: pageDict.commentFailed ?? (isRtl ? 'ثبت دیدگاه انجام نشد' : 'Could not submit comment'),
        description: pageDict.loginRequired ?? (isRtl ? 'برای ثبت دیدگاه باید وارد حساب کاربری شوید.' : 'Please sign in to comment.'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [articleId, isRtl, loadComments, pageDict, requireLogin, requireVerifiedEmail, toast]);

  return (
    <section className={cn('space-y-6', isRtl && 'text-right')} dir={isRtl ? 'rtl' : 'ltr'}>
      <div>
        <h2 className="font-headline text-2xl font-bold">{pageDict.commentsTitle ?? 'Comments'}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {pageDict.commentsSubtitle ?? (isRtl ? 'پرسش‌ها و دیدگاه‌های خود را درباره این مقاله ثبت کنید.' : 'Share your questions and thoughts about this article.')}
        </p>
      </div>

      <CommentForm dict={pageDict} isSubmitting={isSubmitting} onSubmit={submitComment} />

      <div className="space-y-4">
        {isFetching ? (
          <p className="rounded-xl border bg-background p-6 text-center text-sm text-muted-foreground">
            {pageDict.loadingComments ?? (isRtl ? 'در حال دریافت دیدگاه‌ها...' : 'Loading comments...')}
          </p>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              dict={pageDict}
              isRtl={isRtl}
              onRequireLogin={requireLogin}
              onReply={submitComment}
              isSubmitting={isSubmitting}
            />
          ))
        ) : (
          <p className="rounded-xl border border-dashed bg-background p-8 text-center text-sm text-muted-foreground">
            {pageDict.noComments ?? (isRtl ? 'هنوز دیدگاهی ثبت نشده است. اولین دیدگاه را شما بنویسید.' : 'No comments yet. Be the first to comment.')}
          </p>
        )}
      </div>
    </section>
  );
}
