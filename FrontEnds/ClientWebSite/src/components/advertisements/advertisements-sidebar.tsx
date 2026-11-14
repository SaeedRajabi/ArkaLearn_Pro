'use client';

import Link from 'next/link';
import {
  ArrowUpRight,
  BookMarked,
  BookOpen,
  Download,
  Eye,
  FileText,
  FolderKanban,
  GraduationCap,
  Info,
  MessagesSquare,
  Phone,
  Presentation,
  Sparkles,
  Star,
  Trophy,
  type LucideIcon,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import getInitials from '@/components/shared/avatar-initializer';
import { getAdvertisementDetailHref } from '@/lib/advertisement-routes';
import type { TeacherAdvertisementListItem } from '@/lib/api/teacher-advertisements';
import { resolveNavLabel } from '@/lib/nav-config';
import { getUserImageUrl } from '@/lib/utils/image-url';
import { cn } from '@/lib/utils';

export function advertisementPopularityScore(item: TeacherAdvertisementListItem): number {
  return (
    (item.listingStarLevel ?? 0) * 120 +
    item.points * 2 +
    item.likeCount * 4 +
    item.reviewCount * 6
  );
}

type NavLink = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
};

const SECTION_LINKS: NavLink[] = [
  { href: '/courses', labelKey: 'courses', icon: BookOpen },
  { href: '/seminars', labelKey: 'seminars', icon: Presentation },
  { href: '/articles', labelKey: 'articles', icon: FileText },
  { href: '/books', labelKey: 'books', icon: BookMarked },
  { href: '/software', labelKey: 'software', icon: Download },
  { href: '/projects', labelKey: 'projectsList', icon: FolderKanban },
  { href: '/teachers', labelKey: 'teachers', icon: GraduationCap },
  { href: '/qa', labelKey: 'qa', icon: MessagesSquare },
  { href: '/about', labelKey: 'about', icon: Info },
  { href: '/contact', labelKey: 'contact', icon: Phone },
];

type Props = {
  items: TeacherAdvertisementListItem[];
  pageDict: Record<string, string>;
  headerDict: Record<string, string | undefined>;
  lang: 'en' | 'fa';
  loading?: boolean;
  className?: string;
};

function SidebarSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      {[0, 1, 2].map((block) => (
        <div key={block} className="overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-4">
          <div className="mb-3 h-4 w-28 animate-pulse rounded bg-muted" />
          <div className="space-y-3">
            {[0, 1, 2].map((row) => (
              <div key={row} className="flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-2.5 w-1/2 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdvertisementsSidebar({
  items,
  pageDict,
  headerDict,
  lang,
  loading = false,
  className,
}: Props) {
  if (loading) {
    return (
      <aside className={cn('space-y-4', className)}>
        <SidebarSkeleton />
      </aside>
    );
  }

  const topTeachers = [...items]
    .sort((a, b) => {
      const starDiff = (b.listingStarLevel ?? 0) - (a.listingStarLevel ?? 0);
      if (starDiff !== 0) return starDiff;
      return advertisementPopularityScore(b) - advertisementPopularityScore(a);
    })
    .filter((item, index, arr) => arr.findIndex((x) => x.teacherId === item.teacherId) === index)
    .slice(0, 5);

  const popularAds = [...items]
    .sort((a, b) => advertisementPopularityScore(b) - advertisementPopularityScore(a))
    .slice(0, 5);

  return (
    <aside className={cn('space-y-4', className)}>
      {/* Top teachers */}
      <section className="overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-b from-amber-500/10 via-card to-card shadow-sm">
        <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
            <Trophy className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h3 className="text-sm font-semibold tracking-tight">
              {pageDict.sidebarTopTeachers ?? (lang === 'fa' ? 'برترین اساتید' : 'Top teachers')}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {pageDict.sidebarTopTeachersHint ??
                (lang === 'fa' ? 'بر اساس امتیاز و سطح ویژه' : 'By rating & featured level')}
            </p>
          </div>
        </div>
        <ul className="divide-y divide-border/40 p-2">
          {topTeachers.length === 0 ? (
            <li className="px-3 py-6 text-center text-xs text-muted-foreground">
              {pageDict.sidebarEmpty ?? (lang === 'fa' ? 'موردی نیست' : 'Nothing yet')}
            </li>
          ) : (
            topTeachers.map((item, index) => {
              const href = getAdvertisementDetailHref(item);
              const name = item.teacherDisplayName || item.title;
              return (
                <li key={`top-${item.teacherId}-${item.id}`}>
                  <Link
                    href={href}
                    className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-amber-500/10"
                  >
                    <span
                      className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums',
                        index === 0
                          ? 'bg-amber-500 text-white'
                          : index === 1
                            ? 'bg-slate-400 text-white'
                            : index === 2
                              ? 'bg-orange-700/80 text-white'
                              : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {index + 1}
                    </span>
                    <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm transition group-hover:ring-amber-400/40">
                      <AvatarImage src={getUserImageUrl(item.teacherAvatarUrl)} alt={name} />
                      <AvatarFallback className="text-xs">{getInitials(name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium transition-colors group-hover:text-primary">
                        {name}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" aria-hidden />
                        <span className="tabular-nums">{item.points}</span>
                        {(item.listingStarLevel ?? 0) > 0 ? (
                          <span className="ms-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:text-amber-200">
                            {item.listingStarLevel}★
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })
          )}
        </ul>
      </section>

      {/* Most popular ads */}
      <section className="overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-b from-sky-500/10 via-card to-card shadow-sm">
        <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/15 text-sky-700 dark:text-sky-300">
            <Eye className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h3 className="text-sm font-semibold tracking-tight">
              {pageDict.sidebarPopularAds ?? (lang === 'fa' ? 'پربازدیدترین آگهی‌ها' : 'Most popular ads')}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {pageDict.sidebarPopularAdsHint ??
                (lang === 'fa' ? 'بر اساس تعامل و محبوبیت' : 'By engagement & popularity')}
            </p>
          </div>
        </div>
        <ul className="divide-y divide-border/40 p-2">
          {popularAds.length === 0 ? (
            <li className="px-3 py-6 text-center text-xs text-muted-foreground">
              {pageDict.sidebarEmpty ?? (lang === 'fa' ? 'موردی نیست' : 'Nothing yet')}
            </li>
          ) : (
            popularAds.map((item) => {
              const href = getAdvertisementDetailHref(item);
              const name = item.teacherDisplayName || item.title;
              return (
                <li key={`pop-${item.id}`}>
                  <Link
                    href={href}
                    className="group flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-sky-500/10"
                  >
                    <Avatar className="mt-0.5 h-9 w-9 shrink-0 ring-2 ring-background shadow-sm">
                      <AvatarImage src={getUserImageUrl(item.teacherAvatarUrl)} alt={name} />
                      <AvatarFallback className="text-[10px]">{getInitials(name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium transition-colors group-hover:text-primary">
                        {item.title}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">{name}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                        <span className="inline-flex items-center gap-0.5">
                          <Star className="h-2.5 w-2.5 text-amber-500" aria-hidden />
                          {item.points}
                        </span>
                        <span>
                          {item.reviewCount} {pageDict.comments ?? (lang === 'fa' ? 'نظر' : 'reviews')}
                        </span>
                      </p>
                    </div>
                    <ArrowUpRight
                      className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100"
                      aria-hidden
                    />
                  </Link>
                </li>
              );
            })
          )}
        </ul>
      </section>

      {/* Browse other sections */}
      <section className="overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-b from-emerald-500/8 via-card to-card shadow-sm">
        <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
            <Sparkles className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h3 className="text-sm font-semibold tracking-tight">
              {pageDict.sidebarBrowse ?? (lang === 'fa' ? 'بخش‌های دیگر' : 'Browse sections')}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {pageDict.sidebarBrowseHint ??
                (lang === 'fa' ? 'دسترسی سریع به صفحات سایت' : 'Quick links around the site')}
            </p>
          </div>
        </div>
        <nav className="grid grid-cols-2 gap-1.5 p-2.5" aria-label={pageDict.sidebarBrowse}>
          {SECTION_LINKS.map((link) => {
            const Icon = link.icon;
            const label = resolveNavLabel(headerDict, link.labelKey, lang);
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center gap-2 rounded-xl border border-transparent bg-background/50 px-2.5 py-2 text-xs font-medium text-foreground/90 transition hover:border-emerald-500/25 hover:bg-emerald-500/10 hover:text-primary"
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition group-hover:text-primary" aria-hidden />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>
      </section>
    </aside>
  );
}
