'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Loader2, LayoutGrid, List, Search, Calendar, Eye, Edit, Trash2, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { resolveStaticAssetUrl } from '@/lib/apiClient';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLanguage } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import { AddArticleModal } from './add-article-modal';
import type { Article } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  searchArticles,
  deleteArticle as deleteArticleApi,
  getArticleById,
  updateArticle as updateArticleApi,
  type SearchArticleItem,
} from '@/services/article-api.service';
import { AdminTableShell, type TableExportColumn } from '@/components/data-table';

function toValidDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function resolveArticleDate(...values: unknown[]): Date {
  for (const value of values) {
    const parsed = toValidDate(value);
    if (parsed) return parsed;
  }
  return new Date();
}

function formatCardDate(dateValue: unknown, locale: 'en' | 'fa'): string {
  const date = toValidDate(dateValue);
  if (!date) return '-';

  try {
    return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return '-';
  }
}

function mapSearchItemToArticle(item: SearchArticleItem): Article {
  return {
    id: String(item.id),
    title: item.title,
    shortDescription: item.summary,
    longDescription: item.summary,
    category: item.categoryName ?? '',
    status: item.isPublished ? 'Published' : 'Draft',
    publishedAt: resolveArticleDate(item.publishedAt, item.createdAt),
    views: 0,
    imageUrl: item.thumbnailUrl ?? undefined,
    slug: item.slug,
    tags: item.tags ?? [],
  };
}

export function ArticleTable() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();
  const [articles, setArticles] = React.useState<Article[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingArticle, setEditingArticle] = React.useState<Article | null>(null);
  const [navigatingToId, setNavigatingToId] = React.useState<string | null>(null);
  const [publishingId, setPublishingId] = React.useState<string | null>(null);
  const [view, setView] = React.useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(12);
  const localeCode = locale === 'fa' ? 'fa-IR' : 'en-US';

  const filteredArticles = React.useMemo(() => {
    return articles.filter(article => 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [articles, searchTerm]);

  const paginatedArticles = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredArticles.slice(start, start + pageSize);
  }, [filteredArticles, page, pageSize]);

  React.useEffect(() => {
    setPage(1);
  }, [searchTerm, pageSize, view, articles.length]);

  const exportColumns = React.useMemo<TableExportColumn<Article>[]>(
    () => [
      { header: t('articleTable_col_title'), accessor: (row) => row.title },
      { header: t('articleTable_col_status'), accessor: (row) => t(row.status.toLowerCase()) },
      { header: t('articleTable_col_category'), accessor: (row) => row.category },
      {
        header: t('articleTable_col_views'),
        accessor: (row) => (row.status === 'Published' ? row.views : 0),
      },
      {
        header: t('articleTable_col_date'),
        accessor: (row) => formatCardDate(row.publishedAt, locale),
      },
    ],
    [t, locale]
  );

  const handleArticleClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setNavigatingToId(id);
    router.push(`/dashboard/articles/${id}`);
  };

  const fetchArticles = React.useCallback(async () => {
    setLoading(true);
    try {
      const { items } = await searchArticles({ publishedOnly: false });
      setArticles(items.map(mapSearchItemToArticle));
    } catch {
      setArticles([]);
      toast({
        variant: 'destructive',
        title: t('error_title') || 'Error',
        description: t('error_fetch_articles') || 'Failed to load articles.',
      });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  React.useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleDelete = async (id: string, title: string) => {
    try {
      await deleteArticleApi(id);
      setArticles((prev) => prev.filter((a) => a.id !== id));
      toast({
        title: t('article_deleted_title'),
        description: t('article_deleted_description').replace('{title}', title),
      });
    } catch {
      toast({
        variant: 'destructive',
        title: t('error_title') || 'Error',
        description: t('error_delete_article') || 'Failed to delete article.',
      });
    }
  };

  const handleEdit = (article: Article) => {
    setEditingArticle(article);
  };

  const slugify = (title: string): string =>
    title
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-\u0600-\u06FF]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'article';

  const handlePublish = async (article: Article) => {
    setPublishingId(article.id);
    try {
      const full = await getArticleById(article.id);
      if (!full) {
        throw new Error('Article not found');
      }
      await updateArticleApi({
        id: Number(full.id ?? article.id),
        title: full.title ?? article.title,
        summary: full.summary ?? article.shortDescription,
        content: full.content ?? article.longDescription ?? '',
        slug: full.slug ?? article.slug ?? slugify(full.title ?? article.title),
        thumbnailUrl: full.thumbnailUrl ?? article.imageUrl ?? null,
        categoryId: full.categoryId ?? article.categoryId ?? null,
        isPublished: true,
      });
      await fetchArticles();
      toast({
        title: t('article_published_title') || 'Article published',
        description: t('article_published_description') || 'The article has been published.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: t('error_title') || 'Error',
        description: t('error_publish_article') || 'Failed to publish article.',
      });
    } finally {
      setPublishingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('search_articles') || 'Search articles...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
          <Button
            variant={view === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setView('grid')}
            className="h-8 px-2 lg:px-3"
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            <span className="hidden lg:inline">{t('view_grid') || 'Grid'}</span>
          </Button>
          <Button
            variant={view === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setView('list')}
            className="h-8 px-2 lg:px-3"
          >
            <List className="h-4 w-4 mr-2" />
            <span className="hidden lg:inline">{t('view_list') || 'List'}</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-40 bg-muted rounded-t-lg" />
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted w-3/4 rounded" />
                <div className="h-3 bg-muted w-1/2 rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <AdminTableShell
          title={t('articleTable_title')}
          description={t('articleTable_description')}
          locale={locale}
          t={t}
          totalCount={filteredArticles.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[12, 24, 48, 96]}
          exportFilenameBase="articles"
          exportTitle={t('articleTable_title')}
          exportColumns={exportColumns}
          exportRows={paginatedArticles}
          fetchAllExportRows={async () => filteredArticles}
          isEmpty={filteredArticles.length === 0}
          emptyMessage={t('no_articles_found') || 'No articles found'}
          className={view === 'grid' ? 'border-none shadow-none bg-transparent' : undefined}
        >
          {view === 'grid' ? (
            <div className="grid grid-cols-1 gap-6 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in zoom-in-95 duration-500">
              {paginatedArticles.map((article) => (
                <Card key={article.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50">
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    {article.imageUrl ? (
                      <img
                        src={resolveStaticAssetUrl(article.imageUrl)}
                        alt={article.title}
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                        <LayoutGrid className="h-12 w-12 opacity-20" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge variant={article.status === 'Published' ? 'default' : 'secondary'} className="shadow-sm">
                        {t(article.status.toLowerCase())}
                      </Badge>
                    </div>
                  </div>
                  <CardHeader className="p-4 pb-2 space-y-1">
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{article.category}</p>
                        <Link 
                          href={`/dashboard/articles/${article.id}`}
                          onClick={(e) => handleArticleClick(e, article.id)}
                          className={cn("block font-bold leading-tight hover:text-primary transition-colors line-clamp-2", navigatingToId === article.id && 'cursor-wait opacity-70')}
                        >
                          {navigatingToId === article.id && <Loader2 className="inline mr-2 h-3 w-3 animate-spin" />}
                          {article.title}
                        </Link>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4 min-h-[3.75rem]">
                      {article.shortDescription}
                    </p>
                    {article.tags && article.tags.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-1.5">
                        {article.tags.slice(0, 4).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3 mt-auto">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatCardDate(article.publishedAt, locale)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>{article.views.toLocaleString(localeCode)}</span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {article.status === 'Draft' && (
                            <DropdownMenuItem onClick={() => handlePublish(article)} disabled={publishingId === article.id}>
                              {publishingId === article.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                              )}
                              {t('actions_publish') || 'Publish'}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleEdit(article)}>
                            <Edit className="mr-2 h-4 w-4" />
                            {t('actions_edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDelete(article.id, article.title)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('actions_delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead style={{textAlign: locale==='fa' ? 'right' : 'left'}} className="pl-6">{t('articleTable_col_title')}</TableHead>
                  <TableHead style={{textAlign: locale==='fa' ? 'right' : 'left'}}>{t('articleTable_col_status')}</TableHead>
                  <TableHead style={{textAlign: locale==='fa' ? 'right' : 'left'}} className="hidden md:table-cell">{t('articleTable_col_category')}</TableHead>
                  <TableHead style={{textAlign: locale==='fa' ? 'right' : 'left'}} className="hidden lg:table-cell">{t('articleTable_col_views')}</TableHead>
                  <TableHead style={{textAlign: locale==='fa' ? 'right' : 'left'}} className="text-right pr-6">{t('articleTable_col_actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedArticles.map((article) => (
                  <TableRow key={article.id} className="group">
                    <TableCell className="font-medium pl-6">
                      <Link
                        href={`/dashboard/articles/${article.id}`}
                        onClick={(e) => handleArticleClick(e, article.id)}
                        className={cn(
                          'inline-flex items-center gap-2 hover:text-primary transition-colors',
                          navigatingToId === article.id && 'cursor-wait'
                        )}
                      >
                        {article.imageUrl && (
                          <div className="h-8 w-12 relative rounded overflow-hidden hidden sm:block">
                            <img 
                              src={resolveStaticAssetUrl(article.imageUrl)} 
                              alt="" 
                              className="object-cover w-full h-full"
                            />
                          </div>
                        )}
                        <span className="font-semibold">
                          {navigatingToId === article.id && <Loader2 className="inline mr-2 h-3 w-3 animate-spin" />}
                          {article.title}
                        </span>
                      </Link>
                      {article.tags && article.tags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {article.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px]">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={article.status === 'Published' ? 'default' : 'secondary'} className="capitalize">
                        {t(article.status.toLowerCase())}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{article.category}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {article.status === 'Published' ? article.views.toLocaleString(localeCode) : '-'}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {article.status === 'Draft' && (
                            <DropdownMenuItem onClick={() => handlePublish(article)} disabled={publishingId === article.id}>
                              {publishingId === article.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                              )}
                              {t('actions_publish') || 'Publish'}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleEdit(article)}>
                            <Edit className="mr-2 h-4 w-4" />
                            {t('actions_edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDelete(article.id, article.title)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('actions_delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </AdminTableShell>
      )}
      <AddArticleModal
        open={!!editingArticle}
        onOpenChangeAction={(isOpen) => !isOpen && setEditingArticle(null)}
        article={editingArticle}
        onSuccessAction={fetchArticles}
      />
    </div>
  );
}
