'use client';

import Link from 'next/link';
import { MessageCircle, ThumbsDown, ThumbsUp } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getBackendApiOrigin } from '@/lib/api/config';
import type { CommunityThreadListItem } from '@/lib/api/community-discussions';

function initials(name?: string | null) {
  const p = (name ?? '?').trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] ?? '?') + (p[1]?.[0] ?? '')).toUpperCase();
}

function resolveAvatar(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${getBackendApiOrigin()}${url.startsWith('/') ? url : `/${url}`}`;
}

type ThreadCardLabels = {
  untitled: string;
  anonymous: string;
  replies: string;
};

interface CommunityQaThreadCardProps {
  thread: CommunityThreadListItem;
  variant: 'list' | 'grid';
  labels: ThreadCardLabels;
}

export function CommunityQaThreadCard({ thread, variant, labels }: CommunityQaThreadCardProps) {
  const title = thread.subject || labels.untitled;
  const isGrid = variant === 'grid';

  return (
    <Link
      href={`/qa/${thread.id}`}
      className={cn(
        'group block rounded-xl border bg-card transition-colors hover:border-primary/30 hover:bg-muted/40 hover:shadow-sm',
        isGrid ? 'flex h-full flex-col p-4' : 'p-4'
      )}
    >
      <div className={cn('flex gap-3', isGrid ? 'flex-col' : 'items-start')}>
        <div className={cn('flex items-center gap-3', isGrid && 'min-w-0')}>
          <Avatar className={cn('shrink-0', isGrid ? 'h-9 w-9' : 'h-10 w-10')}>
            <AvatarImage src={resolveAvatar(thread.authorAvatarUrl)} alt="" />
            <AvatarFallback>{initials(thread.authorName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3
              className={cn(
                'font-semibold text-foreground group-hover:text-primary',
                isGrid ? 'line-clamp-2 text-base' : 'line-clamp-2 text-lg'
              )}
            >
              {title}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              {thread.authorName ?? labels.anonymous} · {thread.createdAt}
            </p>
          </div>
        </div>

        {thread.contentPreview ? (
          <p
            className={cn(
              'text-sm text-muted-foreground',
              isGrid ? 'line-clamp-3 flex-1' : 'mt-2 line-clamp-2'
            )}
          >
            {thread.contentPreview}
          </p>
        ) : null}

        <div
          className={cn(
            'flex flex-wrap gap-2',
            isGrid ? 'mt-auto pt-3' : 'mt-3'
          )}
        >
          <Badge variant="secondary" className="gap-1">
            <MessageCircle className="h-3 w-3" />
            {thread.replyCount} {labels.replies}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <ThumbsUp className="h-3 w-3" />
            {thread.likeCount}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <ThumbsDown className="h-3 w-3" />
            {thread.dislikeCount}
          </Badge>
        </div>
      </div>
    </Link>
  );
}

export function CommunityQaThreadCardSkeleton({ variant }: { variant: 'list' | 'grid' }) {
  const isGrid = variant === 'grid';
  return (
    <div className={cn('rounded-xl border bg-card p-4', isGrid && 'flex h-full flex-col')}>
      <div className={cn('flex gap-3', isGrid ? 'flex-col' : 'items-start')}>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <Skeleton className={cn('h-4 w-full', isGrid ? 'mt-2' : 'mt-3')} />
        <Skeleton className="h-4 w-5/6" />
        <div className="mt-3 flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
      </div>
    </div>
  );
}
