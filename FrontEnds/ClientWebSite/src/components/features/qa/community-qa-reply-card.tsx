'use client';

import { ThumbsUp } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { QaContentHtml } from '@/components/shared/qa-content-html';
import { cn } from '@/lib/utils';
import type { CommunityReplyItem } from '@/lib/api/community-discussions';

function initials(name?: string | null) {
  const p = (name ?? '?').trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] ?? '?') + (p[1]?.[0] ?? '')).toUpperCase();
}

interface CommunityQaReplyCardProps {
  reply: CommunityReplyItem;
  isRtl: boolean;
  likeLabel: string;
  onLike: () => void;
  liking: boolean;
  resolveMediaUrl: (url: string) => string;
  resolveAvatar: (url?: string | null) => string;
}

export function CommunityQaReplyCard({
  reply,
  isRtl,
  likeLabel,
  onLike,
  liking,
  resolveMediaUrl,
  resolveAvatar,
}: CommunityQaReplyCardProps) {
  return (
    <article
      id={`reply-${reply.id}`}
      className="rounded-lg border bg-card p-4 scroll-mt-24"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="mb-3 flex items-center gap-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={resolveAvatar(reply.authorAvatarUrl)} alt="" />
          <AvatarFallback>{initials(reply.authorName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{reply.authorName ?? 'User'}</p>
          <p className="text-xs text-muted-foreground">{reply.createdAt}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('gap-1', reply.likedByCurrentUser && 'text-primary')}
          onClick={onLike}
          disabled={liking}
        >
          <ThumbsUp className="h-4 w-4" />
          <span>{reply.likeCount}</span>
          <span className="sr-only">{likeLabel}</span>
        </Button>
      </div>
      <QaContentHtml html={reply.contentHtml} resolveMediaUrl={resolveMediaUrl} />
    </article>
  );
}
