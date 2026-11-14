'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import type { ArticleListItem } from '@/types';
import { RemoteImage } from '@/components/shared/remote-image';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Dict = Record<string, string>;

interface ArticlesBlogHeroProps {
  dict: Dict;
  featured: ArticleListItem | null;
  totalCount: number;
  lang: 'en' | 'fa';
  onScrollToArticles: () => void;
  onScrollToCategories: () => void;
}

export function ArticlesBlogHero({
  dict,
  featured,
  totalCount,
  lang,
  onScrollToArticles,
  onScrollToCategories,
}: ArticlesBlogHeroProps) {
  const formatCount = (n: number) => n.toLocaleString(lang === 'fa' ? 'fa-IR' : 'en-US');
  const bannerSrc = '/images/article-banner.jpg';

  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)] dark:shadow-[0_18px_50px_-28px_rgba(0,0,0,0.55)] sm:p-8 lg:p-10">
      <div
        className={cn(
          'grid items-center gap-8 lg:gap-10',
          'lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)]'
        )}
      >
        <div className="space-y-5 order-2 lg:order-1">
          <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {dict.blogBadge ?? (lang === 'fa' ? 'بلاگ آرکا نرم‌افزار' : 'ArkaSoftware Blog')}
          </span>

          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-[2.55rem]">
            <span>{dict.heroTitleBefore ?? (lang === 'fa' ? 'مقالات آموزشی، راهنماهای کاربردی و' : 'Educational articles, practical guides and')}</span>{' '}
            <span className="text-primary">
              {dict.heroTitleAccent ?? (lang === 'fa' ? 'مسیر رشد حرفه‌ای' : 'a professional growth path')}
            </span>
          </h1>

          <p className="max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
            {dict.heroDescription ??
              (lang === 'fa'
                ? 'از مفاهیم پایه تا نکات پیشرفته؛ مقالاتی برای یادگیری مستمر و ساختن مسیر شغلی قوی‌تر.'
                : 'From fundamentals to advanced tips — articles for continuous learning and a stronger career path.')}
          </p>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={onScrollToArticles}
              className="h-11 rounded-xl bg-primary px-5 text-primary-foreground hover:bg-primary/90"
            >
              {dict.viewArticlesCta ?? (lang === 'fa' ? 'مشاهده مقالات' : 'View articles')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onScrollToCategories}
              className="h-11 rounded-xl border-border bg-card px-5 text-foreground hover:bg-muted/50"
            >
              {dict.categoriesCta ?? (lang === 'fa' ? 'دسته‌بندی‌ها' : 'Categories')}
            </Button>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground sm:text-sm">
            <span>
              {(dict.statArticles ?? (lang === 'fa' ? '+{count} مقاله آموزشی' : '+{count} educational articles')).replace(
                '{count}',
                formatCount(Math.max(totalCount, 1))
              )}
            </span>
            <span className="hidden text-border sm:inline">·</span>
            <span>{dict.statWeekly ?? (lang === 'fa' ? 'به‌روزرسانی هفتگی' : 'Weekly updates')}</span>
            <span className="hidden text-border sm:inline">·</span>
            <span>
              {dict.statAudience ??
                (lang === 'fa' ? 'مخصوص توسعه‌دهندگان فارسی‌زبان' : 'Built for Persian developers')}
            </span>
          </div>
        </div>

        <motion.div
          className="relative order-1 overflow-hidden rounded-2xl lg:order-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-muted sm:aspect-[5/4]">
            <RemoteImage
              src={bannerSrc}
              alt={dict.heroBannerAlt ?? (lang === 'fa' ? 'بنر صفحه مقالات' : 'Articles page banner')}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>

          {featured ? (
            <Link
              href={`/articles/${featured.slug}`}
              className="absolute bottom-4 start-4 end-4 rounded-2xl border border-border/60 bg-card/95 p-4 shadow-lg backdrop-blur-sm transition hover:shadow-xl sm:start-auto sm:end-4 sm:max-w-[min(100%,280px)]"
            >
              <p className="text-[11px] font-medium text-primary">
                {dict.featuredOfWeek ?? (lang === 'fa' ? 'مقاله ویژه هفته' : 'Featured this week')}
              </p>
              <p className="mt-1 line-clamp-2 text-sm font-bold leading-6 text-foreground">{featured.title}</p>
            </Link>
          ) : null}
        </motion.div>
      </div>
    </section>
  );
}
