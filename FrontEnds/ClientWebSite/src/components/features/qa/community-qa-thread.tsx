'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  ArrowLeft,
  Bell,
  BellOff,
  Send,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { useRequireVerifiedEmail } from '@/hooks/use-require-verified-email';
import { getDictValue } from '@/lib/i18n-client';
import { getBackendApiOrigin } from '@/lib/api/config';
import { getApiErrorMessage } from '@/lib/api/client';
import type { Dictionary } from '@/types';
import { QaRichTextEditor } from '@/components/ui/qa-rich-text-editor';
import {
  getCommunityThreadById,
  likeCommunityReply,
  reactCommunityThread,
  submitCommunityReply,
  subscribeCommunityThread,
  unsubscribeCommunityThread,
  uploadCommunityQaAudio,
  uploadCommunityQaImage,
  type CommunityThreadDetail,
} from '@/lib/api/community-discussions';
import { useCommunityQaHub, scrollToCommunityReply } from '@/hooks/use-community-qa-hub';
import { playNotificationSound } from '@/lib/notification-sound';
import { CommunityQaReplyCard } from './community-qa-reply-card';
import { QaContentHtml } from '@/components/shared/qa-content-html';
import { resolveQaMediaUrl } from '@/lib/qa-content-html';

function resolveMediaUrl(url?: string | null): string {
  if (!url) return '';
  return resolveQaMediaUrl(url);
}

function initials(name?: string | null) {
  const p = (name ?? '?').trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] ?? '?') + (p[1]?.[0] ?? '')).toUpperCase();
}

interface CommunityQaThreadProps {
  threadId: number;
  dict: Dictionary;
  lang: 'en' | 'fa';
}

export function CommunityQaThread({ threadId, dict, lang }: CommunityQaThreadProps) {
  const { user } = useAuth();
  const { requireVerifiedEmail } = useRequireVerifiedEmail(dict);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const isRtl = lang === 'fa';
  const t = (key: string, def: string) => getDictValue(dict, key, def);

  const [thread, setThread] = useState<CommunityThreadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyHtml, setReplyHtml] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reacting, setReacting] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [likingReplyId, setLikingReplyId] = useState<number | null>(null);
  const pendingScrollReplyId = useRef<number | null>(null);

  const loginHref = `/login?returnUrl=${encodeURIComponent(pathname || `/qa/${threadId}`)}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCommunityThreadById(threadId);
      setThread(data);
    } catch {
      setThread(null);
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  const scrollToReply = useCallback((replyId: number, highlight = true) => {
    pendingScrollReplyId.current = replyId;
    if (!scrollToCommunityReply(replyId, highlight)) return;
    pendingScrollReplyId.current = null;
  }, []);

  useCommunityQaHub({
    threadId,
    userId: user?.id,
    handlers: {
      onReplyPosted: (payload) => {
        if (payload.threadId !== threadId) return;
        playNotificationSound();
        void load().then(() => scrollToReply(payload.replyId));
      },
      onThreadReactionChanged: (payload) => {
        if (payload.threadId !== threadId) return;
        setThread((prev) =>
          prev
            ? { ...prev, likeCount: payload.likes, dislikeCount: payload.dislikes }
            : prev
        );
      },
      onReplyLikeChanged: (payload) => {
        if (payload.threadId !== threadId) return;
        setThread((prev) =>
          prev
            ? {
                ...prev,
                replies: prev.replies.map((r) =>
                  r.id === payload.replyId ? { ...r, likeCount: payload.likeCount } : r
                ),
              }
            : prev
        );
      },
      onNotificationPulse: () => void load(),
    },
  });

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (loading || !thread) return;

    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (hash.startsWith('#reply-')) {
      const replyId = Number(hash.slice(7));
      if (Number.isFinite(replyId) && replyId > 0) {
        scrollToReply(replyId);
      }
    } else if (pendingScrollReplyId.current) {
      scrollToReply(pendingScrollReplyId.current);
    }
  }, [loading, thread, scrollToReply]);

  const handleReply = async () => {
    if (!user) {
      router.push(loginHref);
      return;
    }
    if (!requireVerifiedEmail()) return;
    setSubmitting(true);
    try {
      await submitCommunityReply({ threadId, contentHtml: replyHtml });
      setReplyHtml('');
      toast({
        title: t('communityQa.replyPosted', 'Reply posted'),
      });
      await load();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('communityQa.submitError', 'Could not post'),
        description: getApiErrorMessage(err),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReact = async (reaction: -1 | 0 | 1) => {
    if (!user) {
      router.push(loginHref);
      return;
    }
    setReacting(true);
    try {
      const result = await reactCommunityThread(threadId, reaction);
      setThread((prev) =>
        prev
          ? {
              ...prev,
              likeCount: result.likes,
              dislikeCount: result.dislikes,
              myReaction: result.myReaction,
            }
          : prev
      );
    } catch (err) {
      toast({
        variant: 'destructive',
        description: getApiErrorMessage(err),
      });
    } finally {
      setReacting(false);
    }
  };

  const handleSubscribeToggle = async () => {
    if (!user || !thread) {
      router.push(loginHref);
      return;
    }
    setSubscribing(true);
    try {
      if (thread.isSubscribed) {
        await unsubscribeCommunityThread(threadId);
        setThread({ ...thread, isSubscribed: false });
      } else {
        await subscribeCommunityThread(threadId);
        setThread({ ...thread, isSubscribed: true });
      }
    } catch (err) {
      toast({ variant: 'destructive', description: getApiErrorMessage(err) });
    } finally {
      setSubscribing(false);
    }
  };

  const handleLikeReply = async (replyId: number) => {
    if (!user) {
      router.push(loginHref);
      return;
    }
    setLikingReplyId(replyId);
    try {
      const action = await likeCommunityReply(replyId);
      setThread((prev) =>
        prev
          ? {
              ...prev,
              replies: prev.replies.map((r) =>
                r.id === replyId
                  ? {
                      ...r,
                      likedByCurrentUser: action === 'liked',
                      likeCount: action === 'liked' ? r.likeCount + 1 : Math.max(0, r.likeCount - 1),
                    }
                  : r
              ),
            }
          : prev
      );
    } catch (err) {
      toast({ variant: 'destructive', description: getApiErrorMessage(err) });
    } finally {
      setLikingReplyId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          {t('communityQa.notFound', 'Discussion not found.')}
        </p>
        <Button asChild variant="outline">
          <Link href="/qa">{t('communityQa.backToList', 'Back to discussions')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <Button asChild variant="ghost" size="sm" className="gap-2">
        <Link href="/qa">
          <ArrowLeft className="h-4 w-4" />
          {t('communityQa.backToList', 'Back to discussions')}
        </Link>
      </Button>

      <article className="rounded-xl border bg-card p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11">
              <AvatarImage src={resolveMediaUrl(thread.authorAvatarUrl)} alt="" />
              <AvatarFallback>{initials(thread.authorName)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold">
                {thread.subject || t('communityQa.untitled', 'Discussion')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {thread.authorName ?? t('communityQa.anonymous', 'User')} · {thread.createdAt}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => void handleSubscribeToggle()}
            disabled={subscribing}
          >
            {thread.isSubscribed ? (
              <>
                <BellOff className="h-4 w-4" />
                {t('communityQa.unsubscribe', 'Unsubscribe')}
              </>
            ) : (
              <>
                <Bell className="h-4 w-4" />
                {t('communityQa.subscribe', 'Subscribe')}
              </>
            )}
          </Button>
        </div>

        <QaContentHtml
          html={thread.contentHtml}
          resolveMediaUrl={resolveMediaUrl}
          className="mb-4"
        />

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={thread.myReaction === 1 ? 'default' : 'outline'}
            size="sm"
            className="gap-1"
            disabled={reacting}
            onClick={() => void handleReact(thread.myReaction === 1 ? 0 : 1)}
          >
            <ThumbsUp className="h-4 w-4" />
            {thread.likeCount}
          </Button>
          <Button
            type="button"
            variant={thread.myReaction === -1 ? 'default' : 'outline'}
            size="sm"
            className="gap-1"
            disabled={reacting}
            onClick={() => void handleReact(thread.myReaction === -1 ? 0 : -1)}
          >
            <ThumbsDown className="h-4 w-4" />
            {thread.dislikeCount}
          </Button>
        </div>
      </article>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          {thread.replyCount} {t('communityQa.replies', 'replies')}
        </h2>

        {thread.replies.map((reply) => (
          <CommunityQaReplyCard
            key={reply.id}
            reply={reply}
            isRtl={isRtl}
            likeLabel={t('communityQa.like', 'Like')}
            onLike={() => void handleLikeReply(reply.id)}
            liking={likingReplyId === reply.id}
            resolveMediaUrl={resolveMediaUrl}
            resolveAvatar={resolveMediaUrl}
          />
        ))}

        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h3 className="font-medium">{t('communityQa.writeReply', 'Write a reply')}</h3>
          {user ? (
            <>
              <QaRichTextEditor
                value={replyHtml}
                onChange={setReplyHtml}
                onUploadImage={uploadCommunityQaImage}
                onUploadAudio={uploadCommunityQaAudio}
                placeholder={t('communityQa.replyPlaceholder', 'Share your answer or thoughts...')}
              />
              <div className="flex justify-end">
                <Button onClick={() => void handleReply()} disabled={submitting} className="gap-2">
                  <Send className="h-4 w-4" />
                  {submitting
                    ? t('communityQa.submitting', 'Submitting...')
                    : t('communityQa.postReply', 'Post reply')}
                </Button>
              </div>
            </>
          ) : (
            <Button onClick={() => router.push(loginHref)}>
              {t('communityQa.loginToReply', 'Log in to reply')}
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
