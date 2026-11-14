'use client';

import * as React from 'react';
import { Loader2, MessageCircle, Search, UserRound } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  getMySupportStudents,
  PROFESSOR_SUPPORT_STUDENTS_PAGE_SIZE,
  type SupportStudentRow,
} from '@/lib/api/support-chat';
import { getDictValue } from '@/lib/i18n-client';
import type { Dictionary } from '@/types';
import { cn } from '@/lib/utils';
import { DOTS, usePagination } from '@/hooks/use-pagination';

type ProfessorSupportStudentPanelProps = {
  dict: Dictionary;
  onSelectStudent: (student: SupportStudentRow) => void;
  refreshToken?: number;
};

function formatTime(value: string | null | undefined, locale: string) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d);
}

export function ProfessorSupportStudentPanel({
  dict,
  onSelectStudent,
  refreshToken = 0,
}: ProfessorSupportStudentPanelProps) {
  const locale = String(dict.locale ?? 'fa');
  const isRtl = locale === 'fa';
  const t = (key: string, def: string) => getDictValue(dict, key, def);

  const [page, setPage] = React.useState(1);
  const [searchInput, setSearchInput] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [students, setStudents] = React.useState<SupportStudentRow[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);

  const totalPages = Math.max(1, Math.ceil(totalCount / PROFESSOR_SUPPORT_STUDENTS_PAGE_SIZE));
  const paginationRange = usePagination({
    currentPage: page,
    totalCount,
    pageSize: PROFESSOR_SUPPORT_STUDENTS_PAGE_SIZE,
    siblingCount: 1,
  });

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void getMySupportStudents({
      pageNumber: page,
      pageSize: PROFESSOR_SUPPORT_STUDENTS_PAGE_SIZE,
      search,
    })
      .then((result) => {
        if (cancelled) return;
        setStudents(result.items);
        setTotalCount(result.totalCount);
      })
      .catch(() => {
        if (!cancelled) {
          setStudents([]);
          setTotalCount(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, search, refreshToken]);

  return (
    <Card className="flex min-h-[min(calc(100dvh-8rem),920px)] flex-col overflow-hidden">
      <CardHeader className="shrink-0 space-y-4 border-b pb-4">
        <div>
          <CardTitle className="text-base">
            {t('supportChat.studentsTitle', 'Students who contacted you')}
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('supportChat.studentsSubtitle', 'Select a student to view their support topics.')}
          </p>
        </div>
        <form
          className="relative"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setSearch(searchInput.trim());
          }}
        >
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t('supportChat.searchStudents', 'Search students...')}
            className="ps-9"
          />
        </form>
      </CardHeader>

      <CardContent className="min-h-0 flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-sm">{t('loading', 'Loading…')}</p>
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
            <UserRound className="h-10 w-10 text-muted-foreground/70" />
            <p className="text-sm text-muted-foreground">
              {t('supportChat.noStudents', 'No students have contacted you yet.')}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {students.map((student) => (
              <button
                key={student.studentUserId}
                type="button"
                onClick={() => onSelectStudent(student)}
                className="w-full rounded-xl border bg-card px-4 py-3 text-start transition hover:border-primary/30 hover:bg-primary/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{student.displayName}</p>
                    {student.email ? (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{student.email}</p>
                    ) : null}
                  </div>
                  {student.unreadCount > 0 ? (
                    <Badge className="shrink-0">{student.unreadCount}</Badge>
                  ) : null}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle className="h-3.5 w-3.5" />
                    {student.topicCount} {t('supportChat.topics', 'Support topics')}
                  </span>
                  {student.lastMessageAtUtc ? (
                    <span>{formatTime(student.lastMessageAtUtc, locale)}</span>
                  ) : null}
                </div>
                {student.lastMessagePreview ? (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{student.lastMessagePreview}</p>
                ) : null}
              </button>
            ))}
          </div>
        )}
      </CardContent>

      {!loading && totalPages > 1 ? (
        <div className="shrink-0 border-t p-3">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    if (page > 1) setPage(page - 1);
                  }}
                  className={cn(page <= 1 && 'pointer-events-none opacity-50')}
                />
              </PaginationItem>
              {paginationRange.map((item, index) =>
                item === DOTS ? (
                  <PaginationItem key={`dots-${index}`}>
                    <span className="px-2 text-muted-foreground">…</span>
                  </PaginationItem>
                ) : (
                  <PaginationItem key={item}>
                    <PaginationLink
                      href="#"
                      isActive={item === page}
                      onClick={(event) => {
                        event.preventDefault();
                        setPage(item);
                      }}
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    if (page < totalPages) setPage(page + 1);
                  }}
                  className={cn(page >= totalPages && 'pointer-events-none opacity-50')}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      ) : null}
    </Card>
  );
}
