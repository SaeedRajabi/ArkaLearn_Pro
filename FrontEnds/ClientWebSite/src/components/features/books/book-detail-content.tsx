'use client';



import Link from 'next/link';

import Image from 'next/image';

import { RichHtmlContent } from '@/components/shared/rich-html-content';

import type { TeacherBook } from '@/lib/api/professor-books';

import type { Dictionary } from '@/types';

import { cn } from '@/lib/utils';

import { getBookCoverImageUrl, getBookFileUrl, getUserImageUrl } from '@/lib/utils/image-url';

import { SeoTagLink } from '@/components/shared/seo-tag-link';

import { Button } from '@/components/ui/button';

import {

  ArrowLeft,

  ArrowRight,

  BookOpen,

  CalendarDays,

  Download,

  Hash,

  Tags,

  UserRound,

} from 'lucide-react';



interface BookDetailContentProps {

  book: TeacherBook;

  dict: Dictionary;

  lang: 'en' | 'fa';

}



type BookDownloadOption = {

  key: 'pdf' | 'epub' | 'word' | 'legacy';

  href: string;

  fileName: string;

  label: string;

  inline?: boolean;

};



export function BookDetailContent({ book, dict, lang }: BookDetailContentProps) {

  const isRtl = lang === 'fa';

  const pageDict = (dict.booksPage ?? {}) as Record<string, string>;

  const cover = getBookCoverImageUrl(book.coverImageUrl);

  const teacherName = book.teacherDisplayName?.trim() || book.teacherUserName?.trim() || '';

  const teacherHref = book.teacherUserName

    ? `/advertisements/${encodeURIComponent(book.teacherUserName)}`

    : undefined;



  const downloads: BookDownloadOption[] = [];



  if (book.pdfFileUrl) {

    downloads.push({

      key: 'pdf',

      href: getBookFileUrl(book.pdfFileUrl),

      fileName: book.pdfFileName?.trim() || `${book.title}.pdf`,

      label: pageDict.downloadPdf ?? (isRtl ? 'دانلود PDF' : 'Download PDF'),

      inline: true,

    });

  }



  if (book.epubFileUrl) {

    downloads.push({

      key: 'epub',

      href: getBookFileUrl(book.epubFileUrl),

      fileName: book.epubFileName?.trim() || `${book.title}.epub`,

      label: pageDict.downloadEpub ?? (isRtl ? 'دانلود EPUB' : 'Download EPUB'),

    });

  }



  if (book.wordFileUrl) {

    downloads.push({

      key: 'word',

      href: getBookFileUrl(book.wordFileUrl),

      fileName: book.wordFileName?.trim() || `${book.title}.docx`,

      label: pageDict.downloadWord ?? (isRtl ? 'دانلود Word' : 'Download Word'),

    });

  }



  if (downloads.length === 0 && book.bookFileUrl) {

    downloads.push({

      key: 'legacy',

      href: getBookFileUrl(book.bookFileUrl),

      fileName: book.bookFileName?.trim() || book.title,

      label: pageDict.downloadBook ?? (isRtl ? 'دانلود کتاب' : 'Download book'),

      inline: book.bookFileUrl.toLowerCase().includes('.pdf'),

    });

  }



  const pdfInline = downloads.find((item) => item.inline && item.href);



  return (

    <article className="space-y-12 py-12">

      <div

        className={cn(

          'grid gap-8 lg:grid-cols-[minmax(240px,320px)_minmax(0,1fr)]',

          isRtl && 'lg:grid-cols-[minmax(0,1fr)_minmax(240px,320px)]'

        )}

      >

        <aside className={cn('space-y-4 lg:sticky lg:top-28 lg:self-start', isRtl ? 'lg:order-2' : 'lg:order-1')}>

          <div className="overflow-hidden rounded-xl border bg-background shadow-sm">

            <div className="relative aspect-[3/4] w-full bg-muted">

              <Image

                src={cover}

                alt={book.title}

                fill

                priority

                className="object-cover"

                sizes="(max-width: 1024px) 100vw, 320px"

              />

            </div>

          </div>



          <div className="rounded-xl border bg-background p-5 shadow-sm" dir={isRtl ? 'rtl' : 'ltr'}>

            <Link

              href="/books"

              className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"

            >

              {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}

              {pageDict.backToBooks ?? (isRtl ? 'بازگشت به کتاب‌ها' : 'Back to books')}

            </Link>



            {downloads.length > 0 ? (

              <div className="mb-5 flex flex-col gap-2">

                {downloads.map((item) => (

                  <Button key={item.key} asChild className="w-full gap-2" variant={item.inline ? 'default' : 'secondary'}>

                    <a href={item.href} download={item.fileName} target="_blank" rel="noopener noreferrer">

                      <Download className="h-4 w-4" />

                      {item.label}

                    </a>

                  </Button>

                ))}

                {!pdfInline ? (

                  <p className="text-xs text-muted-foreground">

                    {pageDict.downloadOnlyHint ??

                      (isRtl

                        ? 'برای EPUB و Word، فایل را دانلود کنید.'

                        : 'For EPUB and Word, download the file to read.')}

                  </p>

                ) : null}

              </div>

            ) : null}



            <dl className="space-y-4 text-sm">

              {teacherName ? (

                <div className="flex items-start gap-3">

                  <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

                  <div>

                    <dt className="font-medium">{pageDict.author ?? (isRtl ? 'نویسنده / استاد' : 'Author')}</dt>

                    <dd className="text-muted-foreground">

                      {teacherHref ? (

                        <Link href={teacherHref} className="hover:text-primary hover:underline">

                          {teacherName}

                        </Link>

                      ) : (

                        teacherName

                      )}

                    </dd>

                  </div>

                </div>

              ) : null}



              {book.publisher ? (

                <div className="flex items-start gap-3">

                  <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

                  <div>

                    <dt className="font-medium">{pageDict.publisher ?? (isRtl ? 'ناشر' : 'Publisher')}</dt>

                    <dd className="text-muted-foreground">{book.publisher}</dd>

                  </div>

                </div>

              ) : null}



              {book.publicationYear ? (

                <div className="flex items-start gap-3">

                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

                  <div>

                    <dt className="font-medium">{pageDict.publicationYear ?? (isRtl ? 'سال انتشار' : 'Publication year')}</dt>

                    <dd className="text-muted-foreground">

                      <time dateTime={`${book.publicationYear}`}>{book.publicationYear}</time>

                    </dd>

                  </div>

                </div>

              ) : null}



              {book.isbn ? (

                <div className="flex items-start gap-3">

                  <Hash className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

                  <div>

                    <dt className="font-medium">{pageDict.isbn ?? 'ISBN'}</dt>

                    <dd className="font-mono text-muted-foreground">{book.isbn}</dd>

                  </div>

                </div>

              ) : null}



              {book.categoryName ? (

                <div className="flex items-start gap-3">

                  <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

                  <div>

                    <dt className="font-medium">{pageDict.category ?? (isRtl ? 'دسته‌بندی' : 'Category')}</dt>

                    <dd className="text-muted-foreground">

                      {book.categoryId ? (

                        <Link href={`/books?categoryId=${book.categoryId}`} className="hover:text-primary hover:underline">

                          {book.categoryPath?.length ? book.categoryPath.join(' › ') : book.categoryName}

                        </Link>

                      ) : (

                        book.categoryName

                      )}

                    </dd>

                  </div>

                </div>

              ) : null}

            </dl>

          </div>



          <div className="rounded-xl border bg-background p-5 shadow-sm" dir={isRtl ? 'rtl' : 'ltr'}>

            <div className="mb-3 flex items-center gap-2 font-semibold">

              <Tags className="h-4 w-4 text-primary" />

              {pageDict.tags ?? (isRtl ? 'برچسب‌ها' : 'Tags')}

            </div>

            {book.tags.length > 0 ? (

              <div className="flex flex-wrap gap-2">

                {book.tags.map((tag) => (

                  <SeoTagLink key={tag} tag={tag} />

                ))}

              </div>

            ) : (

              <p className="text-sm text-muted-foreground">

                {pageDict.noTags ?? (isRtl ? 'برچسبی ثبت نشده است.' : 'No tags were added.')}

              </p>

            )}

          </div>

        </aside>



        <div className={cn('min-w-0 space-y-6', isRtl ? 'lg:order-1' : 'lg:order-2')}>

          <header className="space-y-4">

            <h1 className="font-headline text-3xl font-bold leading-tight md:text-4xl">{book.title}</h1>

            {teacherName && book.teacherAvatarUrl ? (

              <div className="flex items-center gap-3">

                <Image

                  src={getUserImageUrl(book.teacherAvatarUrl)}

                  alt={teacherName}

                  width={40}

                  height={40}

                  className="rounded-full object-cover"

                />

                {teacherHref ? (

                  <Link href={teacherHref} className="text-sm font-medium hover:text-primary hover:underline">

                    {teacherName}

                  </Link>

                ) : (

                  <span className="text-sm font-medium">{teacherName}</span>

                )}

              </div>

            ) : null}

            {book.shortDescription ? (

              <p className="text-lg leading-relaxed text-muted-foreground">{book.shortDescription}</p>

            ) : null}

          </header>



          {pdfInline ? (

            <section

              className="overflow-hidden rounded-xl border bg-background shadow-sm"

              aria-label={pageDict.readBook ?? (isRtl ? 'مطالعه آنلاین' : 'Read online')}

            >

              <div className="flex items-center justify-between border-b px-4 py-3">

                <h2 className="font-semibold">{pageDict.readBook ?? (isRtl ? 'مطالعه آنلاین' : 'Read online')}</h2>

                <Button variant="outline" size="sm" asChild className="gap-1.5">

                  <a href={pdfInline.href} download={pdfInline.fileName} target="_blank" rel="noopener noreferrer">

                    <Download className="h-3.5 w-3.5" />

                    {pageDict.downloadBook ?? (isRtl ? 'دانلود' : 'Download')}

                  </a>

                </Button>

              </div>

              <iframe

                title={book.title}

                src={pdfInline.href}

                className="h-[min(80vh,900px)] w-full bg-muted"

              />

            </section>

          ) : null}



          {book.longDescriptionHtml ? (

            <section

              className="prose prose-slate max-w-none rounded-xl bg-background p-6 shadow-sm dark:prose-invert sm:p-8"

              dir={isRtl ? 'rtl' : 'ltr'}

              aria-label={pageDict.longDescription ?? (isRtl ? 'توضیحات کامل' : 'Full description')}

            >

              <h2 className="sr-only">{pageDict.longDescription ?? (isRtl ? 'توضیحات کامل' : 'Full description')}</h2>

              <RichHtmlContent html={book.longDescriptionHtml} dir={isRtl ? 'rtl' : 'ltr'} />

            </section>

          ) : null}

        </div>

      </div>

    </article>

  );

}


