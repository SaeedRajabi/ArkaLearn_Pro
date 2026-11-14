'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, MessageCircle, Star, ThumbsUp, Clock3 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import getInitials from '@/components/shared/avatar-initializer';
import { formatActiveDuration, formatPrice } from '@/lib/advertisement-utils';
import { getAdvertisementDetailHref } from '@/lib/advertisement-routes';
import type { TeacherAdvertisementListItem } from '@/lib/api/teacher-advertisements';
import { getUserImageUrl } from '@/lib/utils/image-url';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';

type Props = {
  item: TeacherAdvertisementListItem;
  dict: Record<string, string>;
  layout: 'grid' | 'list';
};

export function AdvertisementCard({ item, dict, layout }: Props) {
  const { locale } = useLanguage();
  const isRtl = locale === 'fa';
  const href = getAdvertisementDetailHref(item);
  const subjects = item.subjectNames || item.teachingCategoryName || '';
  const summary = item.shortSummary || item.workExperience || '';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  const displayName = item.teacherDisplayName || item.title;

  const stats = (
    <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <Star className="h-3.5 w-3.5 text-amber-500" aria-hidden />
        <span>
          {item.points} {dict.rating}
        </span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <MessageCircle className="h-3.5 w-3.5" aria-hidden />
        <span>
          {item.reviewCount} {dict.comments}
        </span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <ThumbsUp className="h-3.5 w-3.5" aria-hidden />
        <span>
          {item.likeCount} {dict.likes}
        </span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Clock3 className="h-3.5 w-3.5" aria-hidden />
        <span>
          {formatActiveDuration(item.memberSinceUtc, {
            days: dict.days,
            months: dict.months,
            years: dict.years,
          })}
        </span>
      </span>
    </div>
  );

  const pricing = (
    <div className="flex flex-wrap gap-2 text-sm">
      {item.hourlyTeachingCost != null ? (
        <div className="rounded-xl border border-teal-500/15 bg-teal-500/8 px-3 py-1.5">
          <span className="text-[11px] text-muted-foreground">{dict.hourlyRate}</span>
          <p className="font-semibold tabular-nums text-foreground">{formatPrice(item.hourlyTeachingCost)}</p>
        </div>
      ) : null}
      {item.privateTeachingCost != null ? (
        <div className="rounded-xl border border-sky-500/15 bg-sky-500/8 px-3 py-1.5">
          <span className="text-[11px] text-muted-foreground">{dict.privateRate}</span>
          <p className="font-semibold tabular-nums text-foreground">{formatPrice(item.privateTeachingCost)}</p>
        </div>
      ) : null}
    </div>
  );

  if (layout === 'list') {
    return (
      <Card className="group overflow-hidden border-border/60 bg-card/90 shadow-sm transition-all duration-300 hover:border-teal-500/30 hover:shadow-lg hover:shadow-teal-500/5">
        <CardContent className="flex flex-col gap-5 p-5 md:flex-row md:items-center">
          <Link href={href} className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start">
            <div className="relative shrink-0">
              <Avatar className="h-20 w-20 ring-2 ring-background shadow-md transition duration-300 group-hover:ring-teal-500/30">
                <AvatarImage src={getUserImageUrl(item.teacherAvatarUrl)} alt={displayName} />
                <AvatarFallback className="text-lg">{getInitials(displayName)}</AvatarFallback>
              </Avatar>
              {(item.listingStarLevel ?? 0) > 0 ? (
                <span className="absolute -bottom-1 -end-1 inline-flex items-center gap-0.5 rounded-full border border-amber-200/70 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/70 dark:text-amber-200">
                  <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" aria-hidden />
                  {item.listingStarLevel}
                </span>
              ) : null}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div>
                <h2 className="font-headline text-lg font-bold transition-colors group-hover:text-teal-700 dark:group-hover:text-teal-300">
                  {displayName}
                </h2>
                <p className="text-sm font-medium text-teal-700/90 dark:text-teal-300/90">{item.title}</p>
              </div>
              {subjects ? <p className="text-sm text-muted-foreground">{subjects}</p> : null}
              {summary ? <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{summary}</p> : null}
              {stats}
            </div>
          </Link>
          <div className="flex shrink-0 flex-col items-stretch gap-3 sm:items-end">
            {pricing}
            <Button
              asChild
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl border-teal-500/25 hover:bg-teal-500/10 hover:text-teal-800 dark:hover:text-teal-200"
            >
              <Link href={href}>
                {dict.viewDetails}
                <ArrowIcon className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group flex h-full flex-col overflow-hidden border-border/60 bg-card/90 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-teal-500/30 hover:shadow-xl hover:shadow-teal-500/5">
      <Link href={href} className="flex flex-1 flex-col">
        <div className="relative overflow-hidden bg-gradient-to-b from-teal-500/15 via-sky-500/8 to-background px-4 pb-5 pt-8">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(20,184,166,0.18),_transparent_55%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -end-8 top-4 h-24 w-24 rounded-full bg-sky-400/20 blur-2xl transition duration-500 group-hover:bg-sky-400/30"
            aria-hidden
          />
          <div className="relative flex flex-col items-center">
            <Avatar className="h-24 w-24 ring-4 ring-background shadow-lg transition duration-300 group-hover:ring-teal-500/25">
              <AvatarImage src={getUserImageUrl(item.teacherAvatarUrl)} alt={displayName} />
              <AvatarFallback className="text-xl">{getInitials(displayName)}</AvatarFallback>
            </Avatar>
            <h2 className="mt-4 text-center font-headline text-lg font-bold transition-colors group-hover:text-teal-700 dark:group-hover:text-teal-300">
              {displayName}
            </h2>
            <p className="mt-1 line-clamp-2 text-center text-sm text-teal-700/90 dark:text-teal-300/90">{item.title}</p>
            {(item.listingStarLevel ?? 0) > 0 ? (
              <Badge className="mt-3 gap-1 border-amber-200/60 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" aria-hidden />
                {item.listingStarLevel}★
              </Badge>
            ) : null}
          </div>
        </div>

        <CardContent className="flex flex-1 flex-col gap-3 p-5">
          {subjects ? (
            <div className="flex flex-wrap gap-1.5">
              {subjects.split('،').slice(0, 3).map((tag) => (
                <Badge key={tag.trim()} variant="secondary" className="rounded-full text-xs font-normal">
                  {tag.trim()}
                </Badge>
              ))}
            </div>
          ) : null}
          {(item.tags?.length ?? 0) > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {item.tags!.slice(0, 4).map((tag) => (
                <Badge key={tag} variant="outline" className="rounded-full text-xs font-normal">
                  #{tag}
                </Badge>
              ))}
            </div>
          ) : null}
          {summary ? (
            <p className={cn('line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground')}>{summary}</p>
          ) : (
            <div className="flex-1" />
          )}
          {stats}
          {(item.hourlyTeachingCost != null || item.privateTeachingCost != null) && (
            <div className="mt-auto flex flex-wrap gap-2 border-t border-border/50 pt-4">
              {item.hourlyTeachingCost != null ? (
                <span className="rounded-lg bg-teal-500/8 px-2.5 py-1 text-xs">
                  <span className="text-muted-foreground">{dict.hourlyRate}: </span>
                  <span className="font-medium tabular-nums text-foreground">{formatPrice(item.hourlyTeachingCost)}</span>
                </span>
              ) : null}
              {item.privateTeachingCost != null ? (
                <span className="rounded-lg bg-sky-500/8 px-2.5 py-1 text-xs">
                  <span className="text-muted-foreground">{dict.privateRate}: </span>
                  <span className="font-medium tabular-nums text-foreground">{formatPrice(item.privateTeachingCost)}</span>
                </span>
              ) : null}
            </div>
          )}
        </CardContent>
      </Link>

      <div className="border-t border-border/50 bg-gradient-to-r from-teal-500/5 via-muted/20 to-sky-500/5 px-5 py-3">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="w-full gap-2 rounded-xl text-teal-700 hover:bg-teal-500/10 hover:text-teal-800 dark:text-teal-300 dark:hover:text-teal-200"
        >
          <Link href={href}>
            {dict.viewDetails}
            <ArrowIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" aria-hidden />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
