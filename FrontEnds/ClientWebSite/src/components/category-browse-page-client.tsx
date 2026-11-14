'use client';

import Link from 'next/link';
import { BookMarked, BookOpen, Download, FileText, Layers, Sparkles } from 'lucide-react';
import type { CategoryBrowseGroup } from '@/lib/category-browse';

type Props = {
  lang: 'en' | 'fa';
  groups: CategoryBrowseGroup[];
  labels: Record<string, string>;
  totalItems: number;
  categoryName: string;
  childCount: number;
  emptyLabel: string;
};

const GROUP_ICONS = {
  course: BookOpen,
  article: FileText,
  book: BookMarked,
  software: Download,
} as const;

const GROUP_ACCENTS: Record<CategoryBrowseGroup['kind'], string> = {
  course: 'from-sky-500/15 to-sky-500/5 border-sky-500/20',
  article: 'from-violet-500/15 to-violet-500/5 border-violet-500/20',
  book: 'from-amber-500/15 to-amber-500/5 border-amber-500/20',
  software: 'from-emerald-500/15 to-emerald-500/5 border-emerald-500/20',
};

export function CategoryBrowsePageClient({
  lang,
  groups,
  labels,
  totalItems,
  categoryName,
  childCount,
  emptyLabel,
}: Props) {
  const isRtl = lang === 'fa';

  if (groups.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-muted/40 to-background px-6 py-14 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Layers className="h-7 w-7" aria-hidden />
        </div>
        <p className="text-lg font-medium">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="grid gap-4 rounded-2xl border bg-gradient-to-br from-primary/8 via-background to-background p-5 shadow-sm sm:grid-cols-3">
        <div className="rounded-xl border bg-card/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {isRtl ? 'کل محتوا' : 'Total items'}
          </p>
          <p className="mt-1 text-3xl font-bold text-primary">{totalItems}</p>
        </div>
        <div className="rounded-xl border bg-card/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {isRtl ? 'دسته فعال' : 'Active category'}
          </p>
          <p className="mt-1 text-lg font-semibold">{categoryName}</p>
        </div>
        <div className="rounded-xl border bg-card/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {isRtl ? 'زیردسته' : 'Subcategories'}
          </p>
          <p className="mt-1 text-3xl font-bold">{childCount}</p>
        </div>
      </div>

      {groups.map((group) => {
        const Icon = GROUP_ICONS[group.kind];
        const title = labels[group.labelKey] ?? group.labelKey;
        const accent = GROUP_ACCENTS[group.kind];

        return (
          <section
            key={group.kind}
            className={`overflow-hidden rounded-2xl border bg-gradient-to-br ${accent}`}
          >
            <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-card/50 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background shadow-sm">
                  <Icon className="h-5 w-5 text-primary" aria-hidden />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {isRtl ? `${group.items.length} مورد` : `${group.items.length} items`}
                  </p>
                </div>
              </div>
              <Sparkles className="h-5 w-5 text-primary/70" aria-hidden />
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {group.items.map((item, index) => (
                <Link
                  key={`${item.kind}-${item.id}`}
                  href={item.href}
                  className="group relative overflow-hidden rounded-xl border bg-card shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
                >
                  <span className="absolute start-3 top-3 z-10 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground shadow">
                    #{index + 1}
                  </span>
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt=""
                      className="h-40 w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-40 items-center justify-center bg-muted/40">
                      <Icon className="h-12 w-12 text-muted-foreground/40" aria-hidden />
                    </div>
                  )}
                  <div className="space-y-2 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        {title}
                      </span>
                      {item.badge ? (
                        <span className="text-xs font-medium text-amber-600">{item.badge}</span>
                      ) : null}
                    </div>
                    <p className="line-clamp-2 font-semibold leading-snug transition group-hover:text-primary">
                      {item.title}
                    </p>
                    {item.subtitle ? (
                      <p className="line-clamp-1 text-xs text-muted-foreground">{item.subtitle}</p>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
