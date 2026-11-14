'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { SoftwareListItem } from '@/lib/api/software';
import type { Dictionary } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Download, Heart, Sparkles, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSoftwareCoverImageUrl, getUserImageUrl } from '@/lib/utils/image-url';
import { motion } from 'motion/react';

interface SoftwareCardProps {
  software: SoftwareListItem;
  dict: Dictionary;
  className?: string;
}

export function SoftwareCard({ software, dict, className }: SoftwareCardProps) {
  const lang = (dict.header as { software?: string }).software === 'Software' ? 'en' : 'fa';
  const isRtl = lang === 'fa';
  const pageDict = (dict.softwarePage ?? {}) as Record<string, string>;
  const cover = getSoftwareCoverImageUrl(software.coverImageUrl);
  const detailHref = software.slug?.trim()
    ? `/software/${encodeURIComponent(software.slug.trim())}`
    : software.id > 0
      ? `/software/item-${software.id}`
      : '/software';
  const teacherName = software.teacherDisplayName?.trim() || software.teacherUserName?.trim() || '';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <motion.article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl',
        className
      )}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
    >
      <Link href={detailHref} className="relative block aspect-[16/10] overflow-hidden bg-muted">
        <Image
          src={cover}
          alt={software.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/5" />

        <div className="absolute start-3 top-3 flex flex-wrap gap-1.5">
          {software.isPlatformOwned ? (
            <Badge className="border-transparent bg-primary/95 text-primary-foreground shadow-sm backdrop-blur-sm">
              <Sparkles className="me-1 h-3 w-3" />
              {pageDict.platformBadge ?? (lang === 'fa' ? 'پلتفرم' : 'Platform')}
            </Badge>
          ) : null}
          {software.categoryName ? (
            <Badge variant="secondary" className="border-transparent bg-background/90 text-foreground backdrop-blur-sm">
              {software.categoryName}
            </Badge>
          ) : null}
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="line-clamp-2 font-headline text-lg font-bold leading-tight text-white transition-colors group-hover:text-primary-foreground">
            {software.title}
          </h3>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        {software.shortDescription ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{software.shortDescription}</p>
        ) : null}

        {software.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {software.tags.map((tag) => (
              <Link
                key={tag}
                href={`/software?tag=${encodeURIComponent(tag)}`}
                className="inline-flex"
                onClick={(event) => event.stopPropagation()}
              >
                <Badge
                  variant="outline"
                  className="cursor-pointer text-xs font-normal transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                >
                  #{tag}
                </Badge>
              </Link>
            ))}
          </div>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-3 border-t pt-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Download className="h-3.5 w-3.5" />
              {software.downloadCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              {software.likeCount}
            </span>
          </div>

          {teacherName ? (
            <span className="inline-flex max-w-[48%] items-center gap-1.5 truncate text-xs text-muted-foreground">
              {software.teacherAvatarUrl ? (
                <Image
                  src={getUserImageUrl(software.teacherAvatarUrl)}
                  alt=""
                  width={20}
                  height={20}
                  className="h-5 w-5 rounded-full object-cover"
                />
              ) : (
                <UserRound className="h-3.5 w-3.5 shrink-0" />
              )}
              <span className="truncate">{teacherName}</span>
            </span>
          ) : null}
        </div>

        <Button asChild variant="secondary" className="h-10 w-full">
          <Link href={detailHref}>
            {pageDict.viewDetails ?? (lang === 'fa' ? 'مشاهده جزئیات' : 'View details')}
            <ArrowIcon className={cn('h-4 w-4', isRtl ? 'me-2' : 'ms-2')} />
          </Link>
        </Button>
      </div>
    </motion.article>
  );
}
