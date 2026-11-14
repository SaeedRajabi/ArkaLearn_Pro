'use client';

import Link from 'next/link';
import type { DashboardRecentArticle } from '@/services/dashboard-service';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLanguage } from '@/components/language-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { getIntlLocale, formatLocalizedNumber } from '@/lib/utils/localized-ui';

interface RecentArticlesProps {
  articles: DashboardRecentArticle[];
  loading?: boolean;
}

export function RecentArticles({ articles, loading }: RecentArticlesProps) {
  const { t, locale } = useLanguage();

  const formatDate = (iso?: string | null) => {
    if (!iso) return t('not_available');
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return t('not_available');
    return new Intl.DateTimeFormat(getIntlLocale(locale), { dateStyle: 'medium' }).format(d);
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <div>
          <CardTitle>{t('recentArticles_title')}</CardTitle>
          <CardDescription>{t('recentArticles_description')}</CardDescription>
        </div>
        <Link
          href="/dashboard/articles"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline shrink-0"
        >
          {t('view_all')}
        </Link>
      </CardHeader>
      <CardContent className="overflow-x-auto px-3 sm:px-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('recentArticles_col_title')}</TableHead>
              <TableHead className="hidden sm:table-cell">{t('recentArticles_col_category')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('recentArticles_col_comments')}</TableHead>
              <TableHead className="text-right hidden sm:table-cell">{t('recentArticles_col_published')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : articles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  {t('recentArticles_empty')}
                </TableCell>
              </TableRow>
            ) : (
              articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="max-w-[220px]">
                    <Link
                      href={`/dashboard/articles/${article.id}`}
                      className="font-medium hover:underline line-clamp-2"
                    >
                      {article.title}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{article.categoryTitle || '—'}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatLocalizedNumber(article.approvedCommentCount, locale)}
                  </TableCell>
                  <TableCell className="text-right hidden sm:table-cell">{formatDate(article.publishedAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
