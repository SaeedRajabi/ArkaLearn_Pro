import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { getArticleBySlug, getArticleDetailSidebarData } from '@/lib/data-server';
import { getDictionary } from '@/lib/i18n';
import { buildContentMetadata } from '@/lib/seo';
import { buildMetaDescription } from '@/lib/seo/meta-helpers';
import { ArticleHero, ArticleDetailContent } from '@/components/features/articles';
import { JsonLdArticle } from '@/components/shared/json-ld-article';
import { JsonLdBreadcrumb } from '@/components/shared/json-ld-breadcrumb';

type Props = { params: Promise<{ slug: string }> };

function extractArticleTags(article: { tags: string[] | { $values?: string[] } }): string[] {
  return Array.isArray(article.tags) ? article.tags : article.tags?.$values ?? [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { robots: { index: false, follow: true } };
  const title = article.seoTitle?.trim() || article.title_en || article.title;
  const description =
    article.metaDescription?.trim() ||
    buildMetaDescription(article.summary, article.content, 160) ||
    title;
  const image = article.ogImageUrl || article.imageUrl;
  const tags = extractArticleTags(article);
  return buildContentMetadata({
    title,
    description,
    path: `/articles/${slug}`,
    image,
    ogType: 'article',
    publishedTime: article.publishDate || undefined,
    authors: [article.author, 'Saeed Rajabi'],
    section: article.categoryName ?? undefined,
    tags,
    keywordsExtra: tags,
  });
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) notFound();

  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);
  const sidebar = await getArticleDetailSidebarData(article);
  const title = lang === 'en' ? article.title_en : article.title;
  const tags = extractArticleTags(article);
  const description = buildMetaDescription(article.summary, article.content, 200) || title;

  return (
    <article>
      <JsonLdArticle
        title={title}
        description={description}
        path={`/articles/${slug}`}
        image={article.imageUrl}
        datePublished={article.publishDate || undefined}
        authorName={article.author}
        category={article.categoryName ?? undefined}
        tags={tags}
      />
      <JsonLdBreadcrumb
        items={[
          { name: lang === 'fa' ? 'خانه' : 'Home', path: '/' },
          { name: lang === 'fa' ? 'مقالات' : 'Articles', path: '/articles' },
          ...(article.categoryName
            ? [{ name: article.categoryName, path: `/articles?category=${encodeURIComponent(article.categoryName)}` }]
            : []),
          { name: title, path: `/articles/${slug}` },
        ]}
      />
      <ArticleHero article={article} lang={lang} />
      <div className="bg-muted/30">
        <div className="mx-auto w-full px-4 sm:px-5 lg:px-6 xl:px-8">
          <ArticleDetailContent
            article={article}
            categoryArticles={sidebar.categoryArticles}
            recentArticles={sidebar.recentArticles}
            categories={sidebar.categories}
            dict={dict}
            lang={lang}
          />
        </div>
      </div>
    </article>
  );
}
