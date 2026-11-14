'use client';

import * as React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Film,
  Heart,
  Loader2,
  MessageCircle,
  Play,
  Send,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';
import getInitials from '@/components/shared/avatar-initializer';
import { PromotionalVideoPlayer } from '@/components/shared/promotional-video-player';
import { getUserImageUrl, getTeacherPromotionalVideoUrl } from '@/lib/utils/image-url';
import { getApiErrorMessage } from '@/lib/api/client';
import {
  addPromotionalVideoComment,
  getPromotionalVideoComments,
  getTeacherPromotionalVideos,
  recordPromotionalVideoView,
  togglePromotionalVideoLike,
  type PromotionalVideoComment,
  type TeacherPromotionalVideo,
} from '@/lib/api/professor-promotional-videos';
import { useEngagementHub } from '@/hooks/use-engagement-hub';
import { ENGAGEMENT_SCOPES } from '@/lib/signalr/engagement-hub';

type Props = {
  teacherId?: number;
  userId?: number;
  userName?: string;
  initialVideos?: TeacherPromotionalVideo[];
  dict: Record<string, string>;
};

function CommentItem({ comment, depth = 0 }: { comment: PromotionalVideoComment; depth?: number }) {
  const authorName = comment.author?.fullName?.trim() || comment.author?.userName?.trim() || 'User';
  return (
    <div className={cn('space-y-2', depth > 0 && 'ms-4 border-s border-border/60 ps-4')}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={getUserImageUrl(comment.author?.avatarUrl)} alt={authorName} />
          <AvatarFallback>{getInitials(authorName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{authorName}</p>
          <p className="text-sm text-muted-foreground">{comment.text}</p>
        </div>
      </div>
      {(comment.replies ?? []).map((reply) => (
        <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
      ))}
    </div>
  );
}

function VideoThumbnail({
  video,
  active,
  onSelect,
}: {
  video: TeacherPromotionalVideo;
  active: boolean;
  onSelect: () => void;
}) {
  const poster = video.thumbnailUrl ? getTeacherPromotionalVideoUrl(video.thumbnailUrl) : '';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group relative aspect-video w-[140px] shrink-0 overflow-hidden rounded-lg border-2 bg-muted transition-all sm:w-[168px]',
        active
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-transparent opacity-80 hover:border-primary/40 hover:opacity-100'
      )}
    >
      {poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt={video.title} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950">
          <Film className="h-6 w-6 text-white/40" />
        </div>
      )}
      <div className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/45" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <p className="line-clamp-2 text-start text-[11px] font-medium leading-tight text-white">{video.title}</p>
      </div>
      {!active ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-foreground shadow">
            <Play className="ms-0.5 h-4 w-4 fill-current" />
          </span>
        </div>
      ) : null}
    </button>
  );
}

function ActiveVideoPanel({
  video,
  dict,
  onViewRecorded,
}: {
  video: TeacherPromotionalVideo;
  dict: Record<string, string>;
  onViewRecorded: () => void;
}) {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [viewCount, setViewCount] = React.useState(video.viewCount);
  const [likeCount, setLikeCount] = React.useState(video.likeCount);
  const [isLiked, setIsLiked] = React.useState(video.isLikedByViewer);
  const [comments, setComments] = React.useState<PromotionalVideoComment[]>([]);
  const [commentsOpen, setCommentsOpen] = React.useState(false);
  const [loadingComments, setLoadingComments] = React.useState(false);
  const [commentText, setCommentText] = React.useState('');
  const [submittingComment, setSubmittingComment] = React.useState(false);
  const [liking, setLiking] = React.useState(false);
  const viewRecordedRef = React.useRef(false);
  const playerKey = `${video.id}-${video.videoUrl}`;

  React.useEffect(() => {
    setViewCount(video.viewCount);
    setLikeCount(video.likeCount);
    setIsLiked(video.isLikedByViewer);
    setComments([]);
    setCommentsOpen(false);
    setCommentText('');
    viewRecordedRef.current = false;
  }, [video.id, video.viewCount, video.likeCount, video.isLikedByViewer, video.videoUrl]);

  const recordViewOnce = React.useCallback(async () => {
    if (viewRecordedRef.current) return;
    viewRecordedRef.current = true;
    try {
      await recordPromotionalVideoView(video.id);
      setViewCount((c) => c + 1);
      onViewRecorded();
    } catch {
      viewRecordedRef.current = false;
    }
  }, [video.id, onViewRecorded]);

  const loadComments = React.useCallback(async () => {
    setLoadingComments(true);
    try {
      const list = await getPromotionalVideoComments(video.id);
      setComments(list);
    } catch (error) {
      toast({
        title: getApiErrorMessage(error, dict.loadCommentsError ?? 'Could not load comments'),
        variant: 'destructive',
      });
    } finally {
      setLoadingComments(false);
    }
  }, [video.id, toast, dict.loadCommentsError]);

  useEngagementHub({
    videoId: video.id,
    handlers: {
      onCommentAdded: (payload) => {
        if (
          payload.scope === ENGAGEMENT_SCOPES.promotionalVideo &&
          payload.entityId === video.id
        ) {
          void loadComments();
        }
      },
      onLikeChanged: (payload) => {
        if (
          payload.scope === ENGAGEMENT_SCOPES.promotionalVideo &&
          payload.entityId === video.id
        ) {
          setLikeCount(payload.likeCount);
        }
      },
    },
  });

  const toggleComments = () => {
    const next = !commentsOpen;
    setCommentsOpen(next);
    if (next && comments.length === 0) void loadComments();
  };

  const onLike = async () => {
    if (!isAuthenticated) {
      toast({ title: dict.loginRequired ?? 'Please sign in to like videos.', variant: 'destructive' });
      return;
    }
    setLiking(true);
    try {
      const result = await togglePromotionalVideoLike(video.id);
      setLikeCount(result.likeCount);
      setIsLiked(result.isLiked);
    } catch (error) {
      toast({
        title: getApiErrorMessage(error, dict.likeError ?? 'Could not update like'),
        variant: 'destructive',
      });
    } finally {
      setLiking(false);
    }
  };

  const submitComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isAuthenticated) {
      toast({ title: dict.loginRequired ?? 'Please sign in to comment.', variant: 'destructive' });
      return;
    }
    const trimmed = commentText.trim();
    if (!trimmed) return;
    setSubmittingComment(true);
    try {
      await addPromotionalVideoComment({ videoId: video.id, content: trimmed });
      setCommentText('');
      await loadComments();
      toast({ title: dict.commentPosted ?? 'Comment posted' });
    } catch (error) {
      toast({
        title: getApiErrorMessage(error, dict.commentError ?? 'Could not post comment'),
        variant: 'destructive',
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border bg-black shadow-lg ring-1 ring-border/50">
        <PromotionalVideoPlayer
          key={playerKey}
          videoUrl={video.videoUrl}
          thumbnailUrl={video.thumbnailUrl}
          title={video.title}
          className="rounded-none"
          onPlay={() => void recordViewOnce()}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h3 className="font-headline text-lg font-semibold leading-snug md:text-xl">{video.title}</h3>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {viewCount} {dict.viewsLabel ?? 'views'}
            </span>
            <span className="inline-flex items-center gap-1">
              <Heart className="h-4 w-4" />
              {likeCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              {video.commentCount}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            variant={isLiked ? 'default' : 'outline'}
            size="sm"
            className="gap-1.5"
            disabled={liking}
            onClick={() => void onLike()}
          >
            {liking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className={cn('h-4 w-4', isLiked && 'fill-current')} />}
            {dict.likeAction ?? 'Like'}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={toggleComments}>
            <MessageCircle className="h-4 w-4" />
            {dict.comments ?? 'Comments'}
          </Button>
        </div>
      </div>

      {commentsOpen ? (
        <Card className="border-dashed">
          <CardContent className="space-y-4 p-4 pt-4">
            {loadingComments ? (
              <p className="text-sm text-muted-foreground">{dict.loading ?? 'Loading…'}</p>
            ) : comments.length === 0 ? (
              <p className="text-sm text-muted-foreground">{dict.noComments ?? 'No comments yet.'}</p>
            ) : (
              <div className="max-h-72 space-y-4 overflow-y-auto pe-1">
                {comments.map((comment) => (
                  <CommentItem key={comment.id} comment={comment} />
                ))}
              </div>
            )}
            <form onSubmit={(e) => void submitComment(e)} className="space-y-2 border-t pt-4">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={dict.commentPlaceholder ?? 'Ask a question or leave a comment…'}
                rows={3}
              />
              <Button type="submit" size="sm" disabled={submittingComment} className="gap-2">
                {submittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {dict.postComment ?? 'Post comment'}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export function TeacherPromotionalVideosSection({
  teacherId,
  userId,
  userName,
  initialVideos,
  dict,
}: Props) {
  const [videos, setVideos] = React.useState<TeacherPromotionalVideo[]>(initialVideos ?? []);
  const [loading, setLoading] = React.useState(initialVideos == null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const stripRef = React.useRef<HTMLDivElement>(null);
  const { isRtl } = useLanguage();

  React.useEffect(() => {
    if (initialVideos != null) {
      setVideos(initialVideos);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await getTeacherPromotionalVideos({ teacherId, userId, userName });
        if (!cancelled) setVideos(list);
      } catch {
        if (!cancelled) setVideos([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [teacherId, userId, userName, initialVideos]);

  React.useEffect(() => {
    if (activeIndex >= videos.length) setActiveIndex(0);
  }, [activeIndex, videos.length]);

  const scrollStrip = (direction: 'prev' | 'next') => {
    const el = stripRef.current;
    if (!el) return;
    const delta = 180;
    const amount = isRtl
      ? direction === 'next'
        ? -delta
        : delta
      : direction === 'next'
        ? delta
        : -delta;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  const selectVideo = (index: number) => {
    setActiveIndex(index);
  };

  if (loading) {
    return (
      <section className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="aspect-video w-full rounded-2xl" />
        <div className="flex gap-3">
          <Skeleton className="h-24 w-36 rounded-lg" />
          <Skeleton className="h-24 w-36 rounded-lg" />
        </div>
      </section>
    );
  }

  if (videos.length === 0) return null;

  const activeVideo = videos[activeIndex] ?? videos[0];
  const showStrip = videos.length > 1;

  return (
    <section className="overflow-hidden rounded-2xl border bg-gradient-to-b from-muted/40 to-background p-4 shadow-sm md:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Film className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-headline text-xl font-bold md:text-2xl">
              {dict.videosTitle ?? 'Promotional videos'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {dict.videosAlbumSubtitle ?? 'Watch intro videos from this teacher'}
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="text-sm">
          {videos.length} {dict.videosCountLabel ?? 'videos'}
        </Badge>
      </div>

      <ActiveVideoPanel
        key={activeVideo.id}
        video={activeVideo}
        dict={dict}
        onViewRecorded={() => undefined}
      />

      {showStrip ? (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-muted-foreground">
              {dict.videosPlaylistLabel ?? 'More videos'}
            </p>
            <div className="flex gap-1">
              <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => scrollStrip('prev')}>
                {isRtl ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
              <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => scrollStrip('next')}>
                {isRtl ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div
            ref={stripRef}
            className="flex gap-3 overflow-x-auto pb-1 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {videos.map((video, index) => (
              <VideoThumbnail
                key={video.id}
                video={video}
                active={index === activeIndex}
                onSelect={() => selectVideo(index)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
