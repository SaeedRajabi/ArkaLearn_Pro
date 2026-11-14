'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { TeacherBookListItem } from '@/lib/api/books';
import type { Dictionary } from '@/types';
import { Badge } from '@/components/ui/badge';
import { UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getBookCoverImageUrl, getUserImageUrl } from '@/lib/utils/image-url';
import { motion } from 'motion/react';

const MotionLink = motion(Link);

interface BookCardProps {
  book: TeacherBookListItem;
  dict: Dictionary;
  className?: string;
  /** Denser listing card for the books grid. */
  compact?: boolean;
}

export function BookCard({ book, dict, className, compact = false }: BookCardProps) {
  const lang = (dict.header as { books?: string }).books === 'Books' ? 'en' : 'fa';
  const pageDict = (dict.booksPage ?? {}) as Record<string, string>;
  const cover = getBookCoverImageUrl(book.coverImageUrl);
  const teacherName = book.teacherDisplayName?.trim() || book.teacherUserName?.trim() || '';

  return (
    <MotionLink
      href={`/books/${encodeURIComponent(book.slug)}`}
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md',
        compact && 'rounded-lg',
        className
      )}
      whileHover={{ y: compact ? -2 : -4 }}
      transition={{ type: 'spring', stiffness: 320 }}
    >
      <div className={cn('relative w-full overflow-hidden bg-muted', compact ? 'aspect-[3/4] max-h-44' : 'aspect-[3/4]')}>
        <Image
          src={cover}
          alt={book.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes={compact ? '(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 16vw' : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
        />
        {book.publicationYear ? (
          <Badge
            className={cn(
              'absolute bg-background/90 text-foreground backdrop-blur-sm',
              compact ? 'top-2 end-2 px-1.5 py-0 text-[10px]' : 'top-3 end-3'
            )}
          >
            {book.publicationYear}
          </Badge>
        ) : null}
      </div>

      <div className={cn('flex flex-1 flex-col', compact ? 'gap-1.5 p-2.5' : 'gap-3 p-4')}>
        <h3
          className={cn(
            'line-clamp-2 font-headline font-bold leading-snug group-hover:text-primary',
            compact ? 'text-sm' : 'text-lg'
          )}
        >
          {book.title}
        </h3>

        {!compact && book.shortDescription ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{book.shortDescription}</p>
        ) : null}

        {compact && book.shortDescription ? (
          <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">{book.shortDescription}</p>
        ) : null}

        <div className={cn('mt-auto space-y-1.5', !compact && 'space-y-2')}>
          {book.categoryName ? (
            <Badge variant="outline" className={cn('w-fit font-normal', compact ? 'text-[10px] px-1.5 py-0' : 'text-xs')}>
              {book.categoryName}
            </Badge>
          ) : null}

          {!compact && book.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {book.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs font-normal">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}

          {teacherName ? (
            <div className={cn('flex items-center gap-1.5 text-muted-foreground', compact ? 'text-[11px]' : 'text-sm')}>
              {book.teacherAvatarUrl && !compact ? (
                <Image
                  src={getUserImageUrl(book.teacherAvatarUrl)}
                  alt={teacherName}
                  width={24}
                  height={24}
                  className="rounded-full object-cover"
                />
              ) : (
                <UserRound className={cn('shrink-0', compact ? 'h-3 w-3' : 'h-4 w-4')} />
              )}
              <span className="line-clamp-1">{teacherName}</span>
            </div>
          ) : null}

          {!compact && book.publisher ? (
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {pageDict.publisher ?? (lang === 'fa' ? 'ناشر' : 'Publisher')}: {book.publisher}
            </p>
          ) : null}
        </div>
      </div>
    </MotionLink>
  );
}
