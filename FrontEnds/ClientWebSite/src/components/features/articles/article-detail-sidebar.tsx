'use client';

import Link from 'next/link';
import type { Article, ArticleListItem } from '@/types';
import type { ArticleCategoryStat } from '@/lib/data-server';
import type { Dictionary } from '@/types';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  FolderOpen,
  GraduationCap,
  LayoutGrid,
  MessageSquare,
  Sparkles,
  Video,
} from 'lucide-react';
import { ArticleSidebarItem } from './article-sidebar-item';

interface ArticleDetailSidebarProps {
  article: Article;
  categoryArticles: ArticleListItem[];
  recentArticles: ArticleListItem[];
  categories: ArticleCategoryStat[];
  dict: Dictionary;
  lang: 'en' | 'fa';
}

export function ArticleDetailSidebar({
  article,
  categoryArticles,
  recentArticles,
  categories,
  dict,
  lang,
}: ArticleDetailSidebarProps) {
  const isRtl = lang === 'fa';
  const pageDict = (dict.articlesPage ?? {}) as Record<string, string>;

  const t = (key: string, en: string, fa: string) => pageDict[key] ?? (isRtl ? fa : en);

  const quickLinks = [
    {
      href: '/articles',
      label: t('allArticles', 'All articles', 'همه مقالات'),
      icon: LayoutGrid,
    },
    {
      href: article.categoryName
        ? `/articles?category=${encodeURIComponent(article.categoryName)}`
        : '/articles',
      label: t('browseCategory', 'Browse this category', 'مقالات این دسته'),
      icon: FolderOpen,
    },
    {
      href: '/courses',
      label: t('courses', 'Courses', 'دوره‌ها'),
      icon: GraduationCap,
    },
    {
      href: '/seminars',
      label: t('seminars', 'Seminars', 'سمینارها'),
      icon: Video,
    },
    {
      href: '/projects',
      label: t('projects', 'Projects', 'پروژه‌ها'),
      icon: FolderOpen,
    },
    {
      href: '/tags',
      label: t('topics', 'Topics & tags', 'موضوعات و برچسب‌ها'),
      icon: BookOpen,
    },
    {
      href: '/qa',
      label: t('communityQa', 'Community Q&A', 'پرسش و پاسخ'),
      icon: MessageSquare,
    },
  ];

  return (
    <aside
      className={cn('space-y-4 lg:sticky lg:top-28 lg:self-start', isRtl ? 'lg:order-1' : 'lg:order-3')}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="rounded-xl border bg-background p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2 font-semibold text-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          {t('quickAccess', 'Quick access', 'دسترسی سریع')}
        </div>
        <nav className="space-y-1">
          {quickLinks.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
            >
              <link.icon className="h-4 w-4 shrink-0" />
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      {categories.length > 0 && (
        <div className="rounded-xl border bg-background p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2 font-semibold text-foreground">
            <FolderOpen className="h-4 w-4 text-primary" />
            {t('categories', 'Categories', 'دسته‌بندی‌ها')}
          </div>
          <ul className="space-y-1">
            {categories.map((cat) => {
              const isActive = cat.name === article.categoryName;
              return (
                <li key={cat.name}>
                  <Link
                    href={`/articles?category=${encodeURIComponent(cat.name)}`}
                    className={cn(
                      'flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-primary/10 font-semibold text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <span className="line-clamp-1">{cat.name}</span>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-xs',
                        isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {cat.count}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {categoryArticles.length > 0 && (
        <div className="rounded-xl border bg-background p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2 font-semibold text-foreground">
            <BookOpen className="h-4 w-4 text-primary" />
            {t('sameCategory', 'More in this category', 'سایر مقالات این دسته')}
          </div>
          <div className="space-y-2">
            {categoryArticles.map((item) => (
              <ArticleSidebarItem key={item.id} article={item} isRtl={isRtl} />
            ))}
          </div>
        </div>
      )}

      {recentArticles.length > 0 && (
        <div className="rounded-xl border bg-background p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2 font-semibold text-foreground">
            <BookOpen className="h-4 w-4 text-primary" />
            {t('recentArticles', 'Recent articles', 'مقالات اخیر')}
          </div>
          <div className="space-y-2">
            {recentArticles.map((item) => (
              <ArticleSidebarItem key={item.id} article={item} isRtl={isRtl} />
            ))}
          </div>
          <Link
            href="/articles"
            className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline"
          >
            {t('viewAllArticles', 'View all articles', 'مشاهده همه مقالات')}
          </Link>
        </div>
      )}
    </aside>
  );
}
