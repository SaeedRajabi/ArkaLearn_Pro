import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { getBookDetailBySlug } from '@/lib/data-server';
import { getDictionary } from '@/lib/i18n';
import { buildContentMetadata } from '@/lib/seo';
import { buildMetaDescription } from '@/lib/seo/meta-helpers';
import { BookDetailContent } from '@/components/features/books';
import { JsonLdBook } from '@/components/shared/json-ld-book';
import { JsonLdBreadcrumb } from '@/components/shared/json-ld-breadcrumb';
import { getBookCoverImageUrl, getBookFileUrl } from '@/lib/utils/image-url';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBookDetailBySlug(slug);
  if (!book) return { robots: { index: false, follow: true } };

  const description =
    book.metaDescription?.trim() ||
    buildMetaDescription(book.shortDescription, book.longDescriptionHtml, 160) ||
    book.title;
  const author = book.teacherDisplayName || book.teacherUserName || undefined;

  return buildContentMetadata({
    title: book.seoTitle?.trim() || book.title,
    description,
    path: `/books/${slug}`,
    image: book.ogImageUrl || getBookCoverImageUrl(book.coverImageUrl),
    ogType: 'article',
    authors: author ? [author] : undefined,
    tags: book.tags,
    keywordsExtra: [
      ...book.tags,
      book.publisher ?? '',
      book.isbn ?? '',
      'کتاب',
      'جزوات',
    ].filter(Boolean),
    ...(book.publicationYear
      ? { publishedTime: `${book.publicationYear}-01-01` }
      : {}),
  });
}

export default async function BookDetailPage({ params }: Props) {
  const { slug } = await params;
  const book = await getBookDetailBySlug(slug);

  if (!book) notFound();

  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);
  const description =
    buildMetaDescription(book.shortDescription, book.longDescriptionHtml, 200) || book.title;
  const authorName = book.teacherDisplayName || book.teacherUserName || undefined;
  const authorUrl = book.teacherUserName
    ? `/advertisements/${encodeURIComponent(book.teacherUserName)}`
    : undefined;

  return (
    <article>
      <JsonLdBook
        title={book.title}
        description={description}
        path={`/books/${slug}`}
        image={getBookCoverImageUrl(book.coverImageUrl)}
        isbn={book.isbn}
        publisher={book.publisher}
        publicationYear={book.publicationYear}
        authorName={authorName}
        authorUrl={authorUrl}
        tags={book.tags}
        downloadUrl={
          book.pdfFileUrl
            ? getBookFileUrl(book.pdfFileUrl)
            : book.bookFileUrl
              ? getBookFileUrl(book.bookFileUrl)
              : undefined
        }
        encodingFormat={
          book.pdfFileUrl || book.bookFileName?.toLowerCase().endsWith('.pdf')
            ? 'application/pdf'
            : undefined
        }
      />
      <JsonLdBreadcrumb
        items={[
          { name: lang === 'fa' ? 'خانه' : 'Home', path: '/' },
          { name: lang === 'fa' ? 'کتاب‌ها' : 'Books', path: '/books' },
          { name: book.title, path: `/books/${slug}` },
        ]}
      />
      <div className="bg-muted/30">
        <div className="mx-auto w-full px-4 sm:px-5 lg:px-6 xl:px-8">
          <BookDetailContent book={book} dict={dict} lang={lang} />
        </div>
      </div>
    </article>
  );
}
