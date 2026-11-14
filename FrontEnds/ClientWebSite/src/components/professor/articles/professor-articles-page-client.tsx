'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { getDictValue } from '@/lib/i18n-client';
import { useLanguage } from '@/contexts/language-context';
import {
  deleteProfessorArticle,
  getMyArticles,
  type ProfessorArticleListItem,
} from '@/lib/api/professor-articles';
import { getMyAdvertisementPlan, type MyAdvertisementPlan } from '@/lib/api/advertisement-monetization';
import { getApiErrorMessage } from '@/lib/api/client';
import { getArticleImageUrl } from '@/lib/utils/image-url';
import { ProfessorArticleFormDialog } from '@/components/professor/articles/professor-article-form-dialog';
import type { Dictionary } from '@/types';
import { useRequireVerifiedEmail } from '@/hooks/use-require-verified-email';

type Props = { dict: Dictionary };

function statusVariant(isPublished: boolean): 'default' | 'secondary' {
  return isPublished ? 'default' : 'secondary';
}

function ArticleCard({
  article,
  t,
  onEdit,
  onDelete,
  deleting,
}: {
  article: ProfessorArticleListItem;
  t: (key: string, fb: string) => string;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const cover = getArticleImageUrl(article.thumbnailUrl);

  return (
    <Card className="flex h-full flex-col overflow-hidden shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-video bg-muted">
        <Image src={cover} alt={article.title} fill className="object-cover" sizes="(max-width:768px) 100vw, 33vw" />
        <div className="absolute start-3 top-3">
          <Badge variant={statusVariant(article.isPublished)}>
            {article.isPublished
              ? t('professorDashboard.articles.statusPublished', 'Published')
              : t('professorDashboard.articles.statusDraft', 'Draft')}
          </Badge>
        </div>
      </div>

      <CardHeader className="space-y-2 pb-2">
        <CardTitle className="line-clamp-2 text-base leading-snug">{article.title}</CardTitle>
        {article.summary ? (
          <p className="line-clamp-3 text-sm text-muted-foreground">{article.summary}</p>
        ) : null}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-2 pb-2">
        {article.categoryName ? (
          <Badge variant="outline" className="w-fit">
            {article.categoryName}
          </Badge>
        ) : null}
        {article.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {article.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs font-normal">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
        <p className="mt-auto text-xs text-muted-foreground">{article.createdAt}</p>
      </CardContent>

      <CardFooter className="mt-auto flex flex-wrap gap-2 border-t bg-muted/20 px-4 py-3">
        {article.isPublished && article.slug ? (
          <Button size="sm" variant="outline" className="gap-1.5" asChild>
            <Link href={`/articles/${encodeURIComponent(article.slug)}`} target="_blank">
              <ExternalLink className="h-3.5 w-3.5" />
              {t('professorDashboard.articles.viewPublic', 'View page')}
            </Link>
          </Button>
        ) : null}
        <Button size="sm" variant="secondary" className="gap-1.5" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
          {t('professorDashboard.articles.edit', 'Edit')}
        </Button>
        <Button size="sm" variant="destructive" className="gap-1.5" disabled={deleting} onClick={onDelete}>
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          {t('professorDashboard.articles.delete', 'Delete')}
        </Button>
      </CardFooter>
    </Card>
  );
}

export function ProfessorArticlesPageClient({ dict }: Props) {
  const { toast } = useToast();
  const { dir } = useLanguage();
  const isRtl = dir === 'rtl';
  const t = React.useCallback((key: string, fb: string) => getDictValue(dict, key, fb), [dict]);
  const { requireVerifiedEmail } = useRequireVerifiedEmail(dict);

  const [articles, setArticles] = React.useState<ProfessorArticleListItem[]>([]);
  const [plan, setPlan] = React.useState<MyAdvertisementPlan | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingArticle, setEditingArticle] = React.useState<ProfessorArticleListItem | null>(null);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [result, planData] = await Promise.all([
        getMyArticles({ search: search.trim(), pageSize: 100 }),
        getMyAdvertisementPlan(),
      ]);
      setArticles(result.queryResult);
      setPlan(planData);
    } catch (error) {
      toast({
        title: getApiErrorMessage(error, t('professorDashboard.articles.loadError', 'Could not load articles')),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [search, toast, t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    if (!requireVerifiedEmail()) return;
    setEditingArticle(null);
    setDialogOpen(true);
  };

  const openEdit = (article: ProfessorArticleListItem) => {
    setEditingArticle(article);
    setDialogOpen(true);
  };

  const remove = async (article: ProfessorArticleListItem) => {
    if (!window.confirm(t('professorDashboard.articles.deleteConfirm', 'Delete this article?'))) return;
    setDeletingId(article.id);
    try {
      await deleteProfessorArticle(article.id);
      toast({ title: t('professorDashboard.articles.deleted', 'Article deleted') });
      await load();
    } catch (error) {
      toast({
        title: getApiErrorMessage(error, t('professorDashboard.articles.deleteError', 'Could not delete article')),
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const atArticleLimit =
    plan != null && !plan.hasPaidFeatures && articles.length >= (plan.freeMaxArticles ?? 1);

  return (
    <div className="space-y-8" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="space-y-2">
        <h1 className="font-headline text-2xl font-bold md:text-3xl">
          {t('professorDashboard.articles.pageTitle', 'Articles')}
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          {t(
            'professorDashboard.articles.pageDescription',
            'Create SEO-optimized articles. Published articles appear on the public articles page with likes and comments.'
          )}
        </p>
      </div>

      {plan && !plan.hasPaidFeatures ? (
        <Alert className="rounded-xl border-amber-500/40 bg-amber-500/5">
          <AlertDescription className="space-y-2">
            <p>
              {t(
                'professorDashboard.articles.freeLimitsBanner',
                `Free plan: up to ${plan.freeMaxArticles} article(s). Upgrade your plan to add more.`
              ).replace('{{max}}', String(plan.freeMaxArticles))}
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/professor/advertisement-plans">
                {t('professorDashboard.articles.viewPlans', 'View plans & upgrade')}
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('professorDashboard.articles.searchPlaceholder', 'Search your articles…')}
          className="max-w-md"
        />
        <Button type="button" className="gap-2 shrink-0" disabled={atArticleLimit} onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {atArticleLimit
            ? t('professorDashboard.articles.limitReached', 'You have reached the free plan article limit.')
            : t('professorDashboard.articles.addArticle', 'Add article')}
        </Button>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-headline text-xl font-semibold">
            {t('professorDashboard.articles.listTitle', 'Your articles')}
          </h2>
          <Badge variant="secondary">
            {articles.length} {t('professorDashboard.articles.countLabel', 'articles')}
          </Badge>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
            {t('professorDashboard.articles.empty', 'No articles yet. Add your first article.')}
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                t={t}
                onEdit={() => openEdit(article)}
                onDelete={() => void remove(article)}
                deleting={deletingId === article.id}
              />
            ))}
          </div>
        )}
      </section>

      <ProfessorArticleFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        article={editingArticle}
        dict={dict}
        onSaved={() => void load()}
      />
    </div>
  );
}
