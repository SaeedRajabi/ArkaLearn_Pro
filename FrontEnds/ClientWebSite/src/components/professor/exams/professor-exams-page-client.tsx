'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { ProfessorCreateExamModal } from '@/components/professor/exams/professor-create-exam-modal';
import { searchProfessorCourses } from '@/lib/api/professor-courses';
import { searchProfessorExams, type ProfessorExamListItem } from '@/lib/api/professor-exams';
import { getDictValue } from '@/lib/i18n-client';
import { useLanguage } from '@/contexts/language-context';
import { formatPickerInputDateTime } from '@/lib/utils/locale-format';
import type { Dictionary } from '@/types';
import { usePagination, DOTS } from '@/hooks/use-pagination';
import { IconSelectPicker } from '@/components/shared/icon-select-picker';

const PAGE_SIZE = 8;
const STATUS_LABELS: Record<number, { fa: string; en: string }> = {
  0: { fa: 'پیش‌نویس', en: 'Draft' },
  1: { fa: 'فعال', en: 'Active' },
  2: { fa: 'بسته', en: 'Closed' },
};

type Props = { dict: Dictionary };

export function ProfessorExamsPageClient({ dict }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useLanguage();
  const isRtl = locale === 'fa';

  const [exams, setExams] = React.useState<ProfessorExamListItem[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [courseFilter, setCourseFilter] = React.useState('');
  const [courses, setCourses] = React.useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(searchParams.get('add') === '1');

  const t = (key: string, fallback: string) => getDictValue(dict, key, fallback);

  React.useEffect(() => {
    if (searchParams.get('add') === '1') setModalOpen(true);
  }, [searchParams]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  React.useEffect(() => {
    searchProfessorCourses({ pageSize: 100 })
      .then((data) => {
        setCourses(
          data.queryResult.map((c) => ({
            value: String(c.id),
            label: c.title,
          }))
        );
      })
      .catch(() => setCourses([]));
  }, []);

  const loadExams = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await searchProfessorExams({
        inputValue: debouncedSearch,
        courseId: courseFilter ? Number(courseFilter) : undefined,
        pageNumber: page,
        pageSize: PAGE_SIZE,
      });
      setExams(data.queryResult);
      setTotalCount(data.totalCount);
    } catch {
      setExams([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, courseFilter, page]);

  React.useEffect(() => {
    loadExams();
  }, [loadExams]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const paginationRange = usePagination({ totalCount, pageSize: PAGE_SIZE, currentPage: page, siblingCount: 1 });

  const closeModal = () => {
    setModalOpen(false);
    router.replace('/professor/exams');
  };

  const statusLabel = (status: number) => {
    const item = STATUS_LABELS[status] ?? STATUS_LABELS[1];
    return isRtl ? item.fa : item.en;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('professorDashboard.menu.exams', isRtl ? 'امتحانات' : 'Exams')}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {t('professorDashboard.exams.pageDescription', isRtl ? 'امتحانات دوره‌های خود را مدیریت کنید.' : 'Manage exams for your courses.')}
          </p>
        </div>
        <Button onClick={() => { setModalOpen(true); router.replace('/professor/exams?add=1'); }}>
          <Plus className="h-4 w-4" />
          {t('professorDashboard.exams.addExam', isRtl ? 'ثبت امتحان جدید' : 'New exam')}
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="ps-9"
            placeholder={t('professorDashboard.exams.searchPlaceholder', isRtl ? 'جستجو...' : 'Search exams...')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="w-full sm:w-64">
          <IconSelectPicker
            options={[{ value: '', label: t('professorDashboard.exams.allCourses', isRtl ? 'همه دوره‌ها' : 'All courses') }, ...courses]}
            value={courseFilter}
            onChange={(v) => { setCourseFilter(v); setPage(1); }}
            placeholder={t('professorDashboard.exams.courseFilter', isRtl ? 'فیلتر دوره' : 'Filter by course')}
            isRtl={isRtl}
            searchable
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : exams.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          {t('professorDashboard.exams.empty', isRtl ? 'هنوز امتحانی ثبت نشده است.' : 'No exams yet.')}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {exams.map((exam) => (
            <Card key={exam.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg leading-snug">{exam.title}</CardTitle>
                  <Badge variant={exam.status === 2 ? 'secondary' : 'default'}>{statusLabel(exam.status)}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{exam.courseTitle}</p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex flex-wrap gap-3 text-muted-foreground">
                  <span>{t('professorDashboard.exams.endsAt', isRtl ? 'پایان' : 'Ends')}: {formatPickerInputDateTime(new Date(exam.endsAtUtc), locale)}</span>
                  <span>{exam.durationMinutes} {t('professorDashboard.exams.minutes', isRtl ? 'دقیقه' : 'min')}</span>
                  <span>{exam.totalPoints} {t('professorDashboard.exams.points', isRtl ? 'امتیاز' : 'pts')}</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline">{t('professorDashboard.exams.assigned', isRtl ? 'دعوت' : 'Assigned')}: {exam.assignedCount}</Badge>
                  <Badge variant="outline">{t('professorDashboard.exams.submitted', isRtl ? 'تحویل' : 'Submitted')}: {exam.submittedCount}</Badge>
                  <Badge variant="outline">{t('professorDashboard.exams.graded', isRtl ? 'تصحیح' : 'Graded')}: {exam.gradedCount}</Badge>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href={`/professor/exams/${exam.id}`}>
                    {t('professorDashboard.exams.viewDetails', isRtl ? 'جزئیات و تصحیح' : 'Details & grading')}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={(e) => { e.preventDefault(); if (page > 1) setPage(page - 1); }}
                className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            {(paginationRange ?? []).map((item, idx) =>
              item === DOTS ? (
                <PaginationItem key={`dots-${idx}`}><span className="px-2">…</span></PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationLink
                    isActive={page === item}
                    onClick={(e) => { e.preventDefault(); setPage(item as number); }}
                    className="cursor-pointer"
                  >
                    {item}
                  </PaginationLink>
                </PaginationItem>
              )
            )}
            <PaginationItem>
              <PaginationNext
                onClick={(e) => { e.preventDefault(); if (page < totalPages) setPage(page + 1); }}
                className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}

      <ProfessorCreateExamModal
        open={modalOpen}
        onOpenChange={(open) => { if (!open) closeModal(); else setModalOpen(true); }}
        dict={dict}
        onSaved={() => { closeModal(); loadExams(); }}
      />
    </div>
  );
}
