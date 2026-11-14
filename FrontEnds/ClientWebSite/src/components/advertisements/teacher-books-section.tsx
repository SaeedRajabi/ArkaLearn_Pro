'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';
import { getBookCoverImageUrl } from '@/lib/utils/image-url';
import { getTeacherBooks, type TeacherBookListItem } from '@/lib/api/books';

type Props = {
  teacherId?: number;
  userId?: number;
  userName?: string;
  initialBooks?: TeacherBookListItem[];
  dict: Record<string, string>;
};

function BookCoverCard({ book, active }: { book: TeacherBookListItem; active?: boolean }) {
  const cover = getBookCoverImageUrl(book.coverImageUrl);

  return (
    <Link
      href={`/books/${encodeURIComponent(book.slug)}`}
      className={cn(
        'group relative block aspect-[3/4] w-[120px] shrink-0 overflow-hidden rounded-lg border-2 bg-muted transition-all sm:w-[140px]',
        active
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-transparent opacity-90 hover:border-primary/40 hover:opacity-100'
      )}
    >
      <Image src={cover} alt={book.title} fill className="object-cover" sizes="140px" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <p className="line-clamp-2 text-start text-[11px] font-medium leading-tight text-white">{book.title}</p>
      </div>
    </Link>
  );
}

export function TeacherBooksSection({
  teacherId,
  userId,
  userName,
  initialBooks,
  dict,
}: Props) {
  const [books, setBooks] = React.useState<TeacherBookListItem[]>(initialBooks ?? []);
  const [loading, setLoading] = React.useState(initialBooks == null);
  const stripRef = React.useRef<HTMLDivElement>(null);
  const { dir } = useLanguage();
  const isRtl = dir === 'rtl';

  React.useEffect(() => {
    if (initialBooks != null) {
      setBooks(initialBooks);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await getTeacherBooks({ teacherId, userId, userName });
        if (!cancelled) setBooks(list);
      } catch {
        if (!cancelled) setBooks([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [teacherId, userId, userName, initialBooks]);

  const scrollStrip = (direction: 'prev' | 'next') => {
    const el = stripRef.current;
    if (!el) return;
    const delta = 160;
    const amount = isRtl
      ? direction === 'next'
        ? -delta
        : delta
      : direction === 'next'
        ? delta
        : -delta;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <section className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-3">
          <Skeleton className="h-44 w-32 rounded-lg" />
          <Skeleton className="h-44 w-32 rounded-lg" />
        </div>
      </section>
    );
  }

  if (books.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-2xl border bg-gradient-to-b from-muted/40 to-background p-4 shadow-sm md:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BookOpen className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-headline text-xl font-bold md:text-2xl">
              {dict.booksTitle ?? 'Published books'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {dict.booksSubtitle ?? 'Books by this teacher'}
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="text-sm">
          {books.length} {dict.booksCountLabel ?? 'books'}
        </Badge>
      </div>

      {books.length === 1 ? (
        <BookCoverCard book={books[0]} active />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-muted-foreground">
              {dict.booksBrowseLabel ?? 'Browse books'}
            </p>
            <div className="flex gap-1">
              <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => scrollStrip('prev')}>
                {isRtl ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
              <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => scrollStrip('next')}>
                {isRtl ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div
            ref={stripRef}
            className="flex gap-3 overflow-x-auto pb-1 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {books.map((book) => (
              <BookCoverCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
