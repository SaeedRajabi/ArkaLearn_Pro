'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  ArrowUpDown,
  Flame,
  LayoutGrid,
  Lightbulb,
  List,
  MessageSquarePlus,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { useRequireVerifiedEmail } from '@/hooks/use-require-verified-email';
import { getDictValue } from '@/lib/i18n-client';
import { getApiErrorMessage } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { usePagination, DOTS } from '@/hooks/use-pagination';
import type { Dictionary } from '@/types';
import { QaRichTextEditor } from '@/components/ui/qa-rich-text-editor';
import {
  searchCommunityThreads,
  submitCommunityThread,
  uploadCommunityQaAudio,
  uploadCommunityQaImage,
  type CommunityThreadListItem,
  type CommunityThreadSort,
} from '@/lib/api/community-discussions';
import { useCommunityQaHub } from '@/hooks/use-community-qa-hub';
import {
  CommunityQaThreadCard,
  CommunityQaThreadCardSkeleton,
} from '@/components/features/qa/community-qa-thread-card';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

const VIEW_STORAGE_KEY = 'community-qa-view';
const DEFAULT_PAGE_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 350;

interface CommunityQaListProps {
  dict: Dictionary;
  lang: 'en' | 'fa';
}

export function CommunityQaList({ dict, lang }: CommunityQaListProps) {
  const { user } = useAuth();
  const { requireVerifiedEmail } = useRequireVerifiedEmail(dict);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const isRtl = lang === 'fa';
  const t = (key: string, def: string) => getDictValue(dict, key, def);
  const reduceMotion = useReducedMotion();

  const [threads, setThreads] = useState<CommunityThreadListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortBy] = useState<CommunityThreadSort>('newest');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [trending, setTrending] = useState<CommunityThreadListItem[]>([]);

  const [askOpen, setAskOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [threadHtml, setThreadHtml] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const listContainerRef = useRef<HTMLDivElement>(null);
  const loginHref = `/login?returnUrl=${encodeURIComponent(pathname || '/qa')}`;

  const cardLabels = {
    untitled: t('communityQa.untitled', 'Discussion'),
    anonymous: t('communityQa.anonymous', 'User'),
    replies: t('communityQa.replies', 'replies'),
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem(VIEW_STORAGE_KEY);
      if (stored === 'list' || stored === 'grid') setLayout(stored);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, layout);
    } catch {
      /* ignore */
    }
  }, [layout]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, sortBy, pageSize, layout]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await searchCommunityThreads({
        pageNumber: currentPage,
        pageSize,
        inputValue: debouncedSearch || undefined,
        sortBy,
      });
      setThreads(data.queryResult);
      setTotalCount(data.totalCount ?? data.queryResult.length);
    } catch {
      setThreads([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, sortBy]);

  const loadTrending = useCallback(async () => {
    try {
      const data = await searchCommunityThreads({
        pageNumber: 1,
        pageSize: 5,
        sortBy: 'mostReplies',
      });
      setTrending(data.queryResult);
    } catch {
      setTrending([]);
    }
  }, []);

  useCommunityQaHub({
    onList: true,
    userId: user?.id,
    handlers: {
      onThreadCreated: () => {
        void load();
        void loadTrending();
      },
      onNotificationPulse: () => void load(),
    },
  });

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadTrending();
  }, [loadTrending]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const paginationRange = usePagination({
    currentPage,
    totalCount,
    siblingCount: 1,
    pageSize,
  });

  const scrollToTopOfList = useCallback(() => {
    const el = listContainerRef.current;
    if (!el) return;
    requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }, []);

  useEffect(() => {
    if (!loading) scrollToTopOfList();
  }, [loading, currentPage, scrollToTopOfList]);

  const handlePageChange = (page: number | string) => {
    if (typeof page === 'string') return;
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setSortBy('newest');
    setCurrentPage(1);
  };

  const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalCount);

  const showingRange = t('communityQa.showingRange', 'Showing {start}–{end} of {total}')
    .replace('{start}', String(rangeStart))
    .replace('{end}', String(rangeEnd))
    .replace('{total}', String(totalCount));

  const handleAsk = async () => {
    if (!user) {
      router.push(loginHref);
      return;
    }
    if (!requireVerifiedEmail()) return;
    setSubmitting(true);
    try {
      const id = await submitCommunityThread({
        subject: subject.trim() || undefined,
        contentHtml: threadHtml,
      });
      toast({
        title: t('communityQa.threadSubmitted', 'Discussion started'),
        description: t('communityQa.threadSubmittedDesc', 'Your question is now live.'),
      });
      setAskOpen(false);
      setSubject('');
      setThreadHtml('');
      if (id) router.push(`/qa/${id}`);
      else void load();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('communityQa.submitError', 'Could not post'),
        description: getApiErrorMessage(err),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const listClass = cn(
    layout === 'grid'
      ? 'grid gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-3'
      : 'space-y-4'
  );

  const SortSelect = ({ compact }: { compact?: boolean }) => (
    <Select value={sortBy} onValueChange={(v) => setSortBy(v as CommunityThreadSort)}>
      <SelectTrigger className={cn(compact && 'w-full')}>
        <SelectValue placeholder={t('communityQa.sortNewest', 'Newest')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="newest">{t('communityQa.sortNewest', 'Newest')}</SelectItem>
        <SelectItem value="mostReplies">{t('communityQa.sortMostReplies', 'Most replies')}</SelectItem>
        <SelectItem value="mostLiked">{t('communityQa.sortMostLiked', 'Most liked')}</SelectItem>
      </SelectContent>
    </Select>
  );

  const PageSizeSelect = ({ compact }: { compact?: boolean }) => (
    <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
      <SelectTrigger className={cn(compact && 'w-full')}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {[12, 24, 48].map((size) => (
          <SelectItem key={size} value={String(size)}>
            {t('communityQa.perPage', '{count} per page').replace('{count}', String(size))}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const SidebarPanel = ({ inSheet = false }: { inSheet?: boolean }) => (
    <div className={cn('space-y-4', inSheet && 'pt-2')}>
      <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-card p-4 shadow-sm">
        <h3 className="font-semibold">{t('communityQa.askQuestion', 'Ask a question')}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('communityQa.askCtaHint', 'Share your question with the community and get answers from peers.')}
        </p>
        <Button
          className="mt-3 w-full"
          onClick={() => (user ? setAskOpen((v) => !v) : router.push(loginHref))}
        >
          <MessageSquarePlus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
          {t('communityQa.askQuestion', 'Ask a question')}
        </Button>
      </div>

      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t('communityQa.filters', 'Filters')}
        </h3>
        <SortSelect compact />
        <PageSizeSelect compact />
        {(debouncedSearch || sortBy !== 'newest') && (
          <Button variant="outline" size="sm" className="w-full gap-2" onClick={handleClearFilters}>
            <X className="h-4 w-4" />
            {t('communityQa.clearFilters', 'Clear filters')}
          </Button>
        )}
      </div>

      <div className="rounded-xl border bg-card p-4">
        <p className="text-2xl font-bold tabular-nums">{totalCount}</p>
        <p className="text-sm text-muted-foreground">
          {t('communityQa.totalDiscussions', 'Total discussions')}
        </p>
      </div>

      {trending.length > 0 && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2 font-semibold">
            <Flame className="h-4 w-4 text-orange-500" />
            {t('communityQa.trending', 'Trending')}
          </div>
          <ul className="space-y-2">
            {trending.map((thread) => (
              <li key={thread.id}>
                <Link
                  href={`/qa/${thread.id}`}
                  className="block text-sm hover:text-primary line-clamp-2"
                >
                  {thread.subject || t('communityQa.untitled', 'Discussion')}
                </Link>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {thread.replyCount} {t('communityQa.replies', 'replies')}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          {t('communityQa.guidelinesTitle', 'Tips')}
        </div>
        <ul className="space-y-1.5 text-sm text-muted-foreground list-disc ltr:pl-4 rtl:pr-4">
          <li>{t('communityQa.guideline1', 'Be clear and specific in your question.')}</li>
          <li>{t('communityQa.guideline2', 'Search before posting to avoid duplicates.')}</li>
          <li>{t('communityQa.guideline3', 'Reply respectfully and mark helpful answers with a like.')}</li>
        </ul>
      </div>
    </div>
  );

  const LayoutToggle = () => (
    <div className="flex items-center overflow-hidden rounded-md border">
      <Button
        type="button"
        variant={layout === 'grid' ? 'default' : 'ghost'}
        size="sm"
        className="rounded-none"
        onClick={() => setLayout('grid')}
        aria-label={t('communityQa.viewAsGrid', 'Grid view')}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={layout === 'list' ? 'default' : 'ghost'}
        size="sm"
        className="rounded-none"
        onClick={() => setLayout('list')}
        aria-label={t('communityQa.viewAsList', 'List view')}
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 lg:flex-row" dir={isRtl ? 'rtl' : 'ltr'}>
      <aside className="hidden w-72 shrink-0 lg:block">
        <div className="sticky top-24">
          <SidebarPanel />
        </div>
      </aside>

      <div className="min-w-0 flex-1 space-y-6">
        <div
          ref={listContainerRef}
          className="rounded-xl border bg-card p-4 shadow-sm scroll-mt-24 space-y-4"
        >
          <div className="relative">
            <Search className="absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground ltr:left-3 rtl:right-3" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('communityQa.searchPlaceholder', 'Search discussions...')}
              className="h-11 ltr:pl-9 rtl:pr-9"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">{showingRange}</p>

            <div className="flex items-center gap-2">
              <div className="lg:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <SlidersHorizontal className="h-4 w-4" />
                      {t('communityQa.sidebar', 'More')}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side={isRtl ? 'left' : 'right'} className="w-[92vw] sm:w-[380px] overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>{t('communityQa.sidebarTitle', 'Q&A options')}</SheetTitle>
                    </SheetHeader>
                    <SidebarPanel inSheet />
                  </SheetContent>
                </Sheet>
              </div>

              <div className="sm:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <ArrowUpDown className="h-4 w-4" />
                      {t('communityQa.sort', 'Sort')}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="rounded-t-2xl">
                    <SheetHeader>
                      <SheetTitle>{t('communityQa.sort', 'Sort')}</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4 space-y-3">
                      <SortSelect compact />
                      <PageSizeSelect compact />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              <div className="hidden sm:block">
                <Tabs
                  value={sortBy}
                  onValueChange={(v) => setSortBy(v as CommunityThreadSort)}
                  className="w-auto"
                >
                  <TabsList>
                    <TabsTrigger value="newest">{t('communityQa.sortNewest', 'Newest')}</TabsTrigger>
                    <TabsTrigger value="mostReplies">
                      {t('communityQa.sortMostReplies', 'Most replies')}
                    </TabsTrigger>
                    <TabsTrigger value="mostLiked">
                      {t('communityQa.sortMostLiked', 'Most liked')}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <LayoutToggle />

              <Button
                className="hidden sm:inline-flex lg:hidden"
                onClick={() => (user ? setAskOpen((v) => !v) : router.push(loginHref))}
              >
                <MessageSquarePlus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {t('communityQa.askQuestion', 'Ask a question')}
              </Button>
            </div>
          </div>

          {debouncedSearch && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">{t('communityQa.activeFilters', 'Active:')}</span>
              <Button
                variant="secondary"
                size="sm"
                className="h-7 rounded-full gap-1"
                onClick={() => setSearchInput('')}
              >
                {debouncedSearch}
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {askOpen && (
          <div className="rounded-xl border bg-card p-4 space-y-4">
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t('communityQa.subjectPlaceholder', 'Short subject (optional)')}
            />
            <QaRichTextEditor
              value={threadHtml}
              onChange={setThreadHtml}
              onUploadImage={uploadCommunityQaImage}
              onUploadAudio={uploadCommunityQaAudio}
              placeholder={t('communityQa.questionPlaceholder', 'Describe your question...')}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAskOpen(false)}>
                {t('communityQa.cancel', 'Cancel')}
              </Button>
              <Button onClick={() => void handleAsk()} disabled={submitting}>
                {submitting
                  ? t('communityQa.submitting', 'Submitting...')
                  : t('communityQa.submitQuestion', 'Post discussion')}
              </Button>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={layout}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {loading ? (
              <div className={listClass}>
                {Array.from({ length: pageSize > 6 ? 6 : pageSize }).map((_, i) => (
                  <CommunityQaThreadCardSkeleton key={i} variant={layout} />
                ))}
              </div>
            ) : threads.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-muted/20 py-16 text-center">
                <p className="text-muted-foreground">
                  {debouncedSearch
                    ? t('communityQa.noResults', 'No discussions match your search.')
                    : t('communityQa.empty', 'No discussions yet. Start the conversation!')}
                </p>
                <Button
                  className="mt-4"
                  onClick={() => (user ? setAskOpen(true) : router.push(loginHref))}
                >
                  <MessageSquarePlus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                  {t('communityQa.askQuestion', 'Ask a question')}
                </Button>
              </div>
            ) : (
              <div className={listClass}>
                {threads.map((thread) => (
                  <CommunityQaThreadCard
                    key={thread.id}
                    thread={thread}
                    variant={layout}
                    labels={cardLabels}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {totalCount > pageSize && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                >
                  {t('communityQa.previous', 'Previous')}
                </PaginationPrevious>
              </PaginationItem>

              {paginationRange?.map((pageNumber, index) => {
                if (pageNumber === DOTS) {
                  return (
                    <PaginationItem key={`dots-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }

                return (
                  <PaginationItem key={`page-${pageNumber}`}>
                    <PaginationLink
                      isActive={currentPage === pageNumber}
                      onClick={() => handlePageChange(pageNumber as number)}
                      disabled={loading}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                >
                  {t('communityQa.next', 'Next')}
                </PaginationNext>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
}
