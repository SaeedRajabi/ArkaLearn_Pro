
'use client';

import * as React from 'react';
import {
  ArrowLeft,
  Calendar,
  Eye,
  Tag,
  Edit,
  Trash2,
  Clock,
  User,
  Share2,
  CheckCircle2,
  Loader2,
  MessageSquare,
  XCircle
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { notFound, useParams, useRouter } from 'next/navigation';
import Image from 'next/image';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/components/language-provider';
import { RichHtmlContent } from '@/components/shared/rich-html-content';
import type { Article } from '@/lib/types';
import {
  approveArticleComment,
  deleteArticleComment,
  getArticleById,
  getArticleComments,
  updateArticle as updateArticleApi,
  deleteArticle as deleteArticleApi,
  type ArticleCommentItem,
} from '@/services/article-api.service';
import { resolveStaticAssetUrl } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import ArticleDetailsLoading from './loading';
import { AddArticleModal } from '../components/add-article-modal';

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-\u0600-\u06FF]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'article';
}

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

function formatDisplayDate(dateValue: unknown, locale: 'en' | 'fa'): string {
  const date = toValidDate(dateValue);
  if (!date) return '-';

  try {
    return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return '-';
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';
}

export default function ArticleDetailsPage() {
  const { t, locale } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const articleId = params.id as string;
  const [article, setArticle] = React.useState<Article | null | undefined>(undefined);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [isContentExpanded, setIsContentExpanded] = React.useState(false);
  const [comments, setComments] = React.useState<ArticleCommentItem[]>([]);
  const [commentsLoading, setCommentsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!articleId) return;
    getArticleById(articleId)
      .then((data) => {
        if (!data) {
          setArticle(null);
          return;
        }
        setArticle({
          id: String(data.id),
          title: data.title ?? '',
          shortDescription: data.summary ?? '',
          longDescription: data.content ?? '',
          category: data.categoryName ?? '',
          status: data.isPublished ? 'Published' : 'Draft',
          publishedAt: resolveArticleDate(data.publishedAt, data.createdAt),
          views: 0,
          imageUrl: data.thumbnailUrl ?? undefined,
          categoryId: data.categoryId ?? undefined,
          slug: data.slug,
          tags: data.tags ?? undefined,
        });
      })
      .catch(() => setArticle(null));
  }, [articleId]);

  const fetchComments = React.useCallback(async () => {
    if (!articleId) return;

    setCommentsLoading(true);
    try {
      const result = await getArticleComments(articleId, {
        onlyApproved: false,
        pageNumber: 1,
        pageSize: 100,
      });
      setComments(result.items);
    } catch {
      setComments([]);
      toast({
        variant: 'destructive',
        title: t('error_title') || 'Error',
        description: t('error_fetch_comments') || 'Failed to load comments.',
      });
    } finally {
      setCommentsLoading(false);
    }
  }, [articleId, t, toast]);

  React.useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  if (article === undefined) {
    return <ArticleDetailsLoading />;
  }

  if (article === null) {
    notFound();
  }

  const handleDelete = async () => {
    try {
      await deleteArticleApi(article.id);
      toast({
        title: t('article_deleted_title'),
        description: t('article_deleted_description').replace('{title}', article.title),
      });
      router.push('/dashboard/articles');
    } catch {
      toast({
        variant: 'destructive',
        title: t('error_title') || 'Error',
        description: t('error_delete_article') || 'Failed to delete article.',
      });
    }
  };

  const handlePublish = async () => {
    if (!article) return;
    setIsPublishing(true);
    try {
      await updateArticleApi({
        id: Number(article.id),
        title: article.title,
        summary: article.shortDescription,
        content: article.longDescription,
        slug: article.slug ?? slugify(article.title),
        thumbnailUrl: article.imageUrl ?? null,
        categoryId: article.categoryId ?? null,
        isPublished: true,
      });
      const data = await getArticleById(article.id);
      if (data) {
        setArticle({
          id: String(data.id),
          title: data.title ?? '',
          shortDescription: data.summary ?? '',
          longDescription: data.content ?? '',
          category: data.categoryName ?? '',
          status: data.isPublished ? 'Published' : 'Draft',
          publishedAt: resolveArticleDate(data.publishedAt, data.createdAt),
          views: article.views,
          imageUrl: data.thumbnailUrl ?? undefined,
          categoryId: data.categoryId ?? undefined,
          slug: data.slug,
          tags: data.tags ?? undefined,
        });
      }
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
      setIsPublishing(false);
    }
  };

  const handleCommentApproval = async (comment: ArticleCommentItem, isApproved: boolean) => {
    try {
      await approveArticleComment(comment.articleId ?? article.id, comment.id, isApproved);
      toast({
        title: isApproved
          ? t('comment_approved_title') || 'Comment approved'
          : t('comment_rejected_title') || 'Comment rejected',
      });
      fetchComments();
    } catch {
      toast({
        variant: 'destructive',
        title: t('error_title') || 'Error',
        description: t('error_approve_comment') || 'Failed to update comment status.',
      });
    }
  };

  const handleCommentDelete = async (comment: ArticleCommentItem) => {
    try {
      await deleteArticleComment(comment.articleId ?? article.id, comment.id);
      toast({ title: t('comment_deleted_title') || 'Comment deleted' });
      fetchComments();
    } catch {
      toast({
        variant: 'destructive',
        title: t('error_title') || 'Error',
        description: t('error_delete_comment') || 'Failed to delete comment.',
      });
    }
  };

  const thumbnailSrc = article.imageUrl
    ? resolveStaticAssetUrl(article.imageUrl)
    : null;

  const handleEditSuccess = () => {
    getArticleById(articleId)
      .then((data) => {
        if (data) {
          setArticle({
            id: String(data.id),
            title: data.title ?? '',
            shortDescription: data.summary ?? '',
            longDescription: data.content ?? '',
            category: data.categoryName ?? '',
            status: data.isPublished ? 'Published' : 'Draft',
            publishedAt: resolveArticleDate(data.publishedAt, data.createdAt),
            views: 0,
            imageUrl: data.thumbnailUrl ?? undefined,
            categoryId: data.categoryId ?? undefined,
            slug: data.slug,
            tags: data.tags ?? undefined,
          });
        }
      })
      .catch(() => {});
  };
  const localeCode = locale === 'fa' ? 'fa-IR' : 'en-US';
  const publishedAtLabel = formatDisplayDate(article.publishedAt, locale);
  const viewsLabel = t('article_details_views').replace(
    '{count}',
    article.views.toLocaleString(localeCode)
  );
  const renderComment = (comment: ArticleCommentItem, depth = 0): React.ReactNode => {
    const authorName = comment.author?.fullName || comment.author?.userName || t('anonymous_user') || 'Anonymous';
    const statusLabel = comment.isApproved
      ? t('status_approved') || 'Approved'
      : t('status_pending') || 'Pending';

    return (
      <div key={comment.id} className={depth > 0 ? 'ms-6 border-s ps-4' : undefined}>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={comment.author?.avatarUrl ?? undefined} alt={authorName} />
                <AvatarFallback>{getInitials(authorName)}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{authorName}</span>
                  <Badge variant={comment.isApproved ? 'default' : 'secondary'}>
                    {statusLabel}
                  </Badge>
                  {comment.rating > 0 && (
                    <Badge variant="outline">{comment.rating}/5</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{comment.timeStamp || '-'}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {!comment.isApproved && (
                <Button size="sm" variant="outline" onClick={() => handleCommentApproval(comment, true)}>
                  <CheckCircle2 className="me-2 h-4 w-4" />
                  {t('actions_approve')}
                </Button>
              )}
              {comment.isApproved && (
                <Button size="sm" variant="outline" onClick={() => handleCommentApproval(comment, false)}>
                  <XCircle className="me-2 h-4 w-4" />
                  {t('actions_reject')}
                </Button>
              )}
              <Button size="sm" variant="destructive" onClick={() => handleCommentDelete(comment)}>
                <Trash2 className="me-2 h-4 w-4" />
                {t('actions_delete')}
              </Button>
            </div>
          </div>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
            {comment.text}
          </p>
        </div>
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Immersive Hero Header */}
      <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] bg-muted overflow-hidden group">
        {thumbnailSrc ? (
          <>
            <Image
              src={thumbnailSrc}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="100vw"
              priority
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-muted to-background" />
        )}
        
        <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-10 lg:p-16 container max-w-7xl mx-auto">
          {/* Top Bar */}
          <div className="flex justify-between items-start">
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-background/80 backdrop-blur-md border-transparent hover:bg-background/90 rounded-full" 
              asChild
            >
              <Link href="/dashboard/articles">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('back_to_articles')}
              </Link>
            </Button>
            
            <div className="flex gap-2">
              {article.status === 'Draft' && (
                <Button
                  variant="default"
                  size="sm"
                  className="bg-primary/90 hover:bg-primary rounded-full shadow-sm"
                  onClick={handlePublish}
                  disabled={isPublishing}
                >
                  {isPublishing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  {t('actions_publish')}
                </Button>
              )}
              <Button 
                variant="secondary" 
                size="sm" 
                className="bg-background/80 backdrop-blur-md hover:bg-background/90 rounded-full shadow-sm"
                onClick={() => setIsEditModalOpen(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                {t('actions_edit')}
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                className="rounded-full shadow-sm"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('actions_delete')}
              </Button>
            </div>
          </div>

          {/* Hero Content */}
          <div className="space-y-4 max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 backdrop-blur-md border-primary/20">
                {article.category}
              </Badge>
              <Badge 
                variant={article.status === 'Published' ? 'default' : 'secondary'}
                className="backdrop-blur-md shadow-sm"
              >
                {t(article.status.toLowerCase())}
              </Badge>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight text-balance">
              {article.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-muted-foreground text-sm md:text-base mt-4">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 border-2 border-background shadow-sm">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-foreground">{t('article_details_author_admin')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{publishedAtLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{t('article_details_read_time')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>{viewsLabel}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 md:px-6 -mt-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* Main Content */}
          <div className="flex flex-col gap-8">
            <Card className="border-none shadow-xl bg-background/95 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-8 md:p-10">
                {article.shortDescription && (
                  <div className="mb-8 rounded-2xl border bg-muted/30 p-5">
                    <h2 className="mb-3 text-lg font-semibold">
                      {t('article_details_summary') || 'Article summary'}
                    </h2>
                    <p className="text-lg text-muted-foreground font-medium leading-relaxed border-l-4 border-primary pl-4">
                      {article.shortDescription}
                    </p>
                  </div>
                )}
                <div className="space-y-4">
                  <div className={!isContentExpanded ? 'relative max-h-80 overflow-hidden' : undefined}>
                    <RichHtmlContent
                      dir="auto"
                      className="prose prose-lg prose-slate dark:prose-invert max-w-none 
                        prose-headings:font-bold prose-headings:tracking-tight 
                        prose-p:leading-relaxed prose-p:text-muted-foreground
                        prose-img:rounded-xl prose-img:shadow-lg prose-img:my-8
                        prose-blockquote:border-l-primary prose-blockquote:bg-muted/50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
                        prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
                      html={article.longDescription}
                    />
                    {!isContentExpanded && (
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
                    )}
                  </div>
                  <Button variant="outline" onClick={() => setIsContentExpanded((prev) => !prev)}>
                    {isContentExpanded
                      ? t('show_less') || 'Show less'
                      : t('show_more') || 'Show more'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-background/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  {t('article_comments_title') || 'Article comments'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {commentsLoading ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('loading') || 'Loading...'}
                  </div>
                ) : comments.length > 0 ? (
                  <div className="space-y-4">
                    {comments.map((comment) => renderComment(comment))}
                  </div>
                ) : (
                  <p className="py-10 text-center text-muted-foreground">
                    {t('no_comments') || 'No comments yet.'}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-24 border-none shadow-lg bg-background/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  {t('article_details_tags')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {article.tags && article.tags.length > 0 ? (
                    article.tags.map((tag) => (
                      <Badge 
                        key={tag} 
                        variant="secondary" 
                        className="px-3 py-1 hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                      >
                        #{tag}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic">{t('article_details_no_tags')}</p>
                  )}
                </div>
                
                <Separator className="my-6" />
                
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    {t('article_details_share')}
                  </h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="rounded-full hover:text-blue-500 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950">
                      <Share2 className="h-4 w-4" />
                    </Button>
                    {/* Add more social buttons as needed */}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AddArticleModal
          open={isEditModalOpen}
          onOpenChangeAction={setIsEditModalOpen}
          article={article}
          onSuccessAction={handleEditSuccess}
      />
    </div>
  );
}
