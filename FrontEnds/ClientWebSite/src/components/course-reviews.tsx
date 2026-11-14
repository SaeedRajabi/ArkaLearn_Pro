'use client';

import type { Course, Dictionary, Review } from '@/lib/definitions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Star, MessageSquareReply } from 'lucide-react';
import { useMemo, useState, useCallback, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { useRequireVerifiedEmail } from '@/hooks/use-require-verified-email';
import { addCourseComment, getCourseComments, type CourseCommentQri } from '@/lib/api/courses';
import { useEngagementHub } from '@/hooks/use-engagement-hub';
import { ENGAGEMENT_SCOPES } from '@/lib/signalr/engagement-hub';

const StarRating = ({ rating, className }: { rating: number; className?: string }) => (
  <div className={cn('flex items-center gap-0.5', className)}>
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={cn(
          'h-5 w-5',
          i < Math.floor(rating) ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'
        )}
      />
    ))}
  </div>
);

function commentToReview(comment: CourseCommentQri): Review {
  const authorName = comment.author?.fullName?.trim() || comment.author?.userName?.trim() || 'User';
  return {
    id: String(comment.id),
    author: authorName,
    email: '',
    avatarUrl: comment.author?.avatarUrl || '',
    avatarHint: 'person avatar',
    rating: comment.rating,
    title: '',
    comment: comment.text,
    date: comment.timeStamp,
    likes: comment.likes,
    dislikes: 0,
    replies: (comment.replies ?? []).map(commentToReview),
  };
}

const ReviewForm = ({
  dict,
  isSubmitting,
  onSubmit,
}: {
  dict: Record<string, string>;
  isSubmitting: boolean;
  onSubmit: (rating: number, comment: string) => Promise<void>;
}) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = comment.trim();
    if (!trimmed || rating < 1) return;
    await onSubmit(rating, trimmed);
    setRating(5);
    setComment('');
  };

  return (
    <div className="mt-12">
      <h3 className="text-2xl font-bold mb-4 font-headline">{dict.submitReview}</h3>
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
        <div>
          <p className="font-medium mb-2">{dict.yourRating}</p>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <button key={i} type="button" onClick={() => setRating(i + 1)}>
                <Star
                  className={cn(
                    'h-6 w-6 transition-colors',
                    i < rating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30 hover:text-amber-400'
                  )}
                />
              </button>
            ))}
          </div>
        </div>
        <Textarea
          placeholder={dict.yourReview}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          required
        />
        <Button type="submit" disabled={isSubmitting}>
          {dict.submit}
        </Button>
      </form>
    </div>
  );
};

const ReviewItem = ({
  review,
  lang,
  dict,
  onReplySubmit,
  level = 0,
}: {
  review: Review;
  lang: 'en' | 'fa';
  dict: Record<string, string>;
  onReplySubmit: (parentId: string, comment: string) => Promise<void>;
  level?: number;
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = replyText.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      await onReplySubmit(review.id, trimmed);
      setReplyText('');
      setIsReplying(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ marginLeft: lang === 'fa' ? undefined : `${level * 2}rem`, marginRight: lang === 'fa' ? `${level * 2}rem` : undefined }}>
      <div className="flex gap-4 items-start pt-8 first:pt-0">
        <Avatar className="h-12 w-12 shrink-0">
          <AvatarImage src={review.avatarUrl} alt={review.author} />
          <AvatarFallback>{review.author.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className={cn('flex items-center justify-between', lang === 'fa' && 'flex-row-reverse')}>
            <div>
              <p className="font-semibold">{review.author}</p>
              <p className="text-xs text-muted-foreground">{review.date}</p>
            </div>
            {review.rating > 0 && <StarRating rating={review.rating} />}
          </div>
          <p className="mt-1 text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{review.comment}</p>
          {level === 0 ? (
            <Button variant="ghost" size="sm" className="mt-3 gap-2" onClick={() => setIsReplying((v) => !v)}>
              <MessageSquareReply className="h-4 w-4" />
              {dict.reply}
            </Button>
          ) : null}
          {isReplying ? (
            <form onSubmit={(e) => void handleReply(e)} className="mt-4 space-y-3 rounded-lg border bg-muted/50 p-4">
              <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={3} required />
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={submitting}>
                  {dict.postReply}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setIsReplying(false)}>
                  {dict.cancel}
                </Button>
              </div>
            </form>
          ) : null}
        </div>
      </div>
      {review.replies && review.replies.length > 0 ? (
        <div className="mt-4 space-y-4 border-s-2 border-muted-foreground/20 ps-4">
          {review.replies.map((reply) => (
            <ReviewItem
              key={reply.id}
              review={reply}
              lang={lang}
              dict={dict}
              onReplySubmit={onReplySubmit}
              level={level + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

const CourseReviews = ({ course, dict }: { course: Course; dict: Dictionary }) => {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const { requireVerifiedEmail } = useRequireVerifiedEmail(dict);
  const pageDict = dict.courseDetailsPage as Record<string, string>;
  const lang = dict.header.courses === 'Courses' ? 'en' : 'fa';
  const courseId = Number(course.id);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requireLogin = useCallback(() => {
    if (isLoading) return false;
    if (isAuthenticated) return true;
    const returnUrl = pathname ? encodeURIComponent(pathname) : '';
    router.push(returnUrl ? `/login?returnUrl=${returnUrl}` : '/login');
    return false;
  }, [isAuthenticated, isLoading, pathname, router]);

  const loadReviews = useCallback(async () => {
    if (!courseId || Number.isNaN(courseId)) {
      setReviews(course.reviewsData ?? []);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const comments = await getCourseComments(courseId, true);
      setReviews(comments.map(commentToReview));
    } catch {
      setReviews((course.reviewsData ?? []).map((r) => r));
    } finally {
      setLoading(false);
    }
  }, [course.reviewsData, courseId]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  useEngagementHub({
    courseId: courseId > 0 ? courseId : undefined,
    handlers: {
      onCommentAdded: (payload) => {
        if (payload.scope === ENGAGEMENT_SCOPES.course && payload.entityId === courseId) {
          void loadReviews();
        }
      },
    },
  });

  const ratingDistribution = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let reviewCount = 0;
    for (const review of reviews) {
      if (review.rating > 0) {
        reviewCount++;
        const rating = Math.floor(review.rating);
        if (rating >= 1 && rating <= 5) counts[rating as keyof typeof counts]++;
      }
    }
    if (reviewCount === 0 && course.reviews > 0) {
      reviewCount = course.reviews;
      counts[5] = Math.floor(reviewCount * 0.6);
      counts[4] = Math.floor(reviewCount * 0.25);
      counts[3] = Math.floor(reviewCount * 0.1);
      counts[2] = Math.floor(reviewCount * 0.03);
      counts[1] = reviewCount - (counts[5] + counts[4] + counts[3] + counts[2]);
    }
    const total = reviewCount > 0 ? reviewCount : 1;
    const percentages = Object.fromEntries(
      Object.entries(counts).map(([key, value]) => [key, (value / total) * 100])
    );
    return { counts, percentages, reviewCount };
  }, [reviews, course.reviews]);

  const handleReviewSubmit = useCallback(
    async (rating: number, comment: string) => {
      if (!requireLogin()) return;
      if (!requireVerifiedEmail()) return;
      setIsSubmitting(true);
      try {
        await addCourseComment({ courseId, content: comment, rating });
        toast({
          title: pageDict.reviewSubmitted ?? (lang === 'fa' ? 'نظر ثبت شد' : 'Review submitted'),
          description:
            pageDict.reviewPending ??
            (lang === 'fa' ? 'نظر شما پس از تأیید استاد نمایش داده می‌شود.' : 'Your review will appear after professor approval.'),
        });
        await loadReviews();
      } catch {
        toast({
          title: pageDict.reviewFailed ?? (lang === 'fa' ? 'ثبت نظر انجام نشد' : 'Could not submit review'),
          variant: 'destructive',
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [courseId, lang, loadReviews, pageDict, requireLogin, requireVerifiedEmail, toast]
  );

  const handleReplySubmit = useCallback(
    async (parentId: string, comment: string) => {
      if (!requireLogin()) return;
      if (!requireVerifiedEmail()) return;
      setIsSubmitting(true);
      try {
        await addCourseComment({ courseId, content: comment, rating: 0, parentId: Number(parentId) });
        toast({
          title: pageDict.replyPosted ?? (lang === 'fa' ? 'پاسخ ثبت شد' : 'Reply posted'),
        });
        await loadReviews();
      } catch {
        toast({
          title: pageDict.reviewFailed ?? (lang === 'fa' ? 'ثبت پاسخ انجام نشد' : 'Could not post reply'),
          variant: 'destructive',
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [courseId, lang, loadReviews, pageDict, requireLogin, requireVerifiedEmail, toast]
  );

  const displayRating =
    ratingDistribution.reviewCount > 0
      ? reviews.reduce((sum, r) => sum + (r.rating > 0 ? r.rating : 0), 0) /
        reviews.filter((r) => r.rating > 0).length
      : course.rating;

  return (
    <div className={cn(lang === 'fa' && 'text-right')} dir={lang === 'fa' ? 'rtl' : 'ltr'}>
      <h2 className="text-2xl font-bold mb-6 font-headline">{pageDict.studentFeedback}</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        <Card className="md:col-span-1 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-6xl font-bold text-amber-500">{displayRating.toFixed(1)}</p>
          <StarRating rating={displayRating} />
          <p className="mt-2 text-sm text-muted-foreground">
            {pageDict.basedOnReviews.replace(
              '{count}',
              String(ratingDistribution.reviewCount || course.reviews)
            )}
          </p>
        </Card>
        <div className="md:col-span-2 space-y-2">
          {([5, 4, 3, 2, 1] as const).map((star) => (
            <div key={star} className="flex items-center gap-4">
              <StarRating rating={star} />
              <Progress value={ratingDistribution.percentages[star]} className="w-full h-2" />
              <span className="text-sm text-muted-foreground w-12 text-end">
                {ratingDistribution.percentages[star].toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 space-y-8 divide-y">
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {pageDict.loadingReviews ?? (lang === 'fa' ? 'در حال بارگذاری نظرات...' : 'Loading reviews...')}
          </p>
        ) : reviews.length > 0 ? (
          reviews.map((review) => (
            <ReviewItem
              key={review.id}
              review={review}
              lang={lang}
              dict={pageDict}
              onReplySubmit={handleReplySubmit}
            />
          ))
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {pageDict.noReviews ?? (lang === 'fa' ? 'هنوز نظری ثبت نشده است.' : 'No reviews yet.')}
          </p>
        )}
      </div>

      <ReviewForm dict={pageDict} isSubmitting={isSubmitting} onSubmit={handleReviewSubmit} />
    </div>
  );
};

export default CourseReviews;
