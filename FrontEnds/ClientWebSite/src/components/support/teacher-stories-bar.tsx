'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TeacherStoryItem } from '@/lib/api/support-chat';

export type TeacherStoryGroup = {
  teacherUserId: number;
  teacherName: string;
  teacherAvatarUrl?: string | null;
  hasUnseen: boolean;
  stories: TeacherStoryItem[];
};

export function groupTeacherStories(stories: TeacherStoryItem[]): TeacherStoryGroup[] {
  const map = new Map<number, TeacherStoryGroup>();
  for (const story of stories) {
    const existing = map.get(story.teacherUserId);
    if (existing) {
      existing.stories.push(story);
      existing.hasUnseen = existing.hasUnseen || story.hasUnseen;
    } else {
      map.set(story.teacherUserId, {
        teacherUserId: story.teacherUserId,
        teacherName: story.teacherName,
        teacherAvatarUrl: story.teacherAvatarUrl,
        hasUnseen: story.hasUnseen,
        stories: [story],
      });
    }
  }
  return [...map.values()].sort((a, b) => Number(b.hasUnseen) - Number(a.hasUnseen));
}

type TeacherStoriesBarProps = {
  groups: TeacherStoryGroup[];
  onOpenGroup: (group: TeacherStoryGroup) => void;
  onPublishClick?: () => void;
  publishLabel?: string;
  emptyLabel?: string;
  className?: string;
};

export function TeacherStoriesBar({
  groups,
  onOpenGroup,
  onPublishClick,
  publishLabel = 'افزودن استوری',
  emptyLabel = 'استوری فعالی وجود ندارد',
  className,
}: TeacherStoriesBarProps) {
  return (
    <div className={cn('rounded-xl border bg-card/40 px-3 py-3', className)}>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {onPublishClick ? (
          <button
            type="button"
            onClick={onPublishClick}
            className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-center"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-primary/50 bg-primary/5 text-primary">
              <Plus className="h-5 w-5" />
            </span>
            <span className="line-clamp-2 text-[11px] leading-tight text-muted-foreground">{publishLabel}</span>
          </button>
        ) : null}

        {groups.map((group) => (
          <button
            key={group.teacherUserId}
            type="button"
            onClick={() => onOpenGroup(group)}
            className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-center"
          >
            <span
              className={cn(
                'rounded-full p-[2px]',
                group.hasUnseen
                  ? 'bg-gradient-to-tr from-emerald-500 via-sky-500 to-violet-500'
                  : 'bg-muted'
              )}
            >
              <span className="block rounded-full bg-background p-[2px]">
                {group.teacherAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={group.teacherAvatarUrl}
                    alt={group.teacherName}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                    {group.teacherName.slice(0, 1)}
                  </span>
                )}
              </span>
            </span>
            <span className="line-clamp-2 text-[11px] leading-tight">{group.teacherName}</span>
          </button>
        ))}

        {!onPublishClick && groups.length === 0 ? (
          <p className="px-2 py-4 text-xs text-muted-foreground">{emptyLabel}</p>
        ) : null}
      </div>
    </div>
  );
}
