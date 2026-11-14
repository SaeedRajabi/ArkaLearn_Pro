'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getCourseUrl } from '@/lib/course-slug';
import type { CourseListItem } from '@/types';

export type CourseParentCategoryOption = {
  id: number;
  name: string;
};

type CoursesStoreHeroDict = {
  storeBadge?: string;
  heroTitleBefore?: string;
  heroTitleAccent?: string;
  heroTitleAfter?: string;
  heroDescription?: string;
  searchPlaceholder?: string;
  allCourses?: string;
  totalCourses?: string;
  filteredResults?: string;
  specialOffer?: string;
};

interface CoursesStoreHeroProps {
  dict: CoursesStoreHeroDict;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  parentCategories: CourseParentCategoryOption[];
  selectedParentId: number | 'all';
  onSelectParent: (id: number | 'all') => void;
  totalCount: number;
  filteredCount: number;
  specialOffer: CourseListItem | null;
  lang: 'en' | 'fa';
}

export function CoursesStoreHero({
  dict,
  searchQuery,
  onSearchChange,
  parentCategories,
  selectedParentId,
  onSelectParent,
  totalCount,
  filteredCount,
  specialOffer,
  lang,
}: CoursesStoreHeroProps) {
  const formatCount = (n: number) => n.toLocaleString(lang === 'fa' ? 'fa-IR' : 'en-US');
  const offerUrl = specialOffer
    ? getCourseUrl({ id: specialOffer.id, slug: specialOffer.slug, title: specialOffer.title })
    : null;

  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)] dark:shadow-[0_18px_50px_-28px_rgba(0,0,0,0.55)] sm:p-8 lg:p-10">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.85fr)] lg:items-start">
        <div className="space-y-5">
          <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {dict.storeBadge}
          </span>

          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-[2.6rem]">
            <span>{dict.heroTitleBefore} </span>
            <span className="bg-gradient-to-l from-sky-500 via-indigo-500 to-fuchsia-500 bg-clip-text text-transparent">
              {dict.heroTitleAccent}
            </span>
            {dict.heroTitleAfter ? <span> {dict.heroTitleAfter}</span> : null}
          </h1>

          <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            {dict.heroDescription}
          </p>

          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={dict.searchPlaceholder}
              className="h-12 rounded-xl border-border bg-muted/40 pe-4 ps-10 text-sm shadow-none focus-visible:ring-primary/30"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onSelectParent('all')}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-sm transition-colors',
                selectedParentId === 'all'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/50'
              )}
            >
              {dict.allCourses}
            </button>
            {parentCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectParent(cat.id)}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-sm transition-colors',
                  selectedParentId === cat.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/50'
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
          <div className="rounded-2xl bg-foreground p-4 text-background sm:min-h-[108px] dark:bg-primary dark:text-primary-foreground">
            <p className="text-xs text-background/70 dark:text-primary-foreground/75">{dict.totalCourses}</p>
            <p className="mt-3 text-4xl font-bold tracking-tight">{formatCount(totalCount)}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 sm:min-h-[108px]">
            <p className="text-xs text-muted-foreground">{dict.filteredResults}</p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-foreground">
              {formatCount(filteredCount)}
            </p>
          </div>

          {specialOffer && offerUrl ? (
            <Link
              href={offerUrl}
              className="col-span-full block overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-fuchsia-500 p-5 text-white transition-transform hover:scale-[1.01]"
            >
              <p className="text-xs font-medium text-white/85">{dict.specialOffer}</p>
              <p className="mt-2 text-lg font-bold leading-snug line-clamp-2">{specialOffer.title}</p>
              {specialOffer.shortDescription ? (
                <p className="mt-2 text-sm text-white/80 line-clamp-2">{specialOffer.shortDescription}</p>
              ) : null}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
