'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LayoutGrid, List, Loader2, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { ProfessorCourseCard } from '@/components/professor/courses/professor-course-card';
import { ProfessorCourseListRow } from '@/components/professor/courses/professor-course-list-row';
import { isProfessorCoursePublishRequested } from '@/components/professor/courses/professor-course-status';
import { ProfessorCourseForm } from '@/components/professor/courses/professor-course-form';
import { getMyCourseById } from '@/lib/api/courses';
import { getApiErrorMessage } from '@/lib/api/client';
import {
  deleteProfessorCourse,
  searchProfessorCourses,
  toggleProfessorCoursePublish,
} from '@/lib/api/professor-courses';
import { getDictValue } from '@/lib/i18n-client';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/contexts/auth-context';
import { useRequireVerifiedEmail } from '@/hooks/use-require-verified-email';
import { useToast } from '@/hooks/use-toast';
import type { CourseQri } from '@/lib/api/types';
import type { CourseListItem, Dictionary } from '@/types';
import { usePagination, DOTS } from '@/hooks/use-pagination';

const PAGE_SIZE = 6;

type Props = { dict: Dictionary };

export function ProfessorCoursesPageClient({ dict }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useLanguage();
  const { user } = useAuth();
  const { requireVerifiedEmail } = useRequireVerifiedEmail(dict);
  const { toast } = useToast();
  const isRtl = locale === 'fa';

  const [courses, setCourses] = React.useState<CourseListItem[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [layout, setLayout] = React.useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(searchParams.get('add') === '1');
  const [courseToEdit, setCourseToEdit] = React.useState<CourseQri | null>(null);
  const [loadingEditCourse, setLoadingEditCourse] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);
  const [togglingId, setTogglingId] = React.useState<number | null>(null);

  const t = (key: string, fallback: string) => getDictValue(dict, key, fallback);

  const labels = {
    students: t('professorDashboard.courses.students', isRtl ? 'دانشجو' : 'students'),
    comments: t('professorDashboard.courses.comments', isRtl ? 'نظر' : 'comments'),
    likes: t('professorDashboard.courses.likes', isRtl ? 'لایک' : 'likes'),
    rating: t('professorDashboard.courses.rating', isRtl ? 'امتیاز' : 'rating'),
    free: t('professorDashboard.courses.free', isRtl ? 'رایگان' : 'Free'),
    view: t('professorDashboard.courses.viewDetails', isRtl ? 'مشاهده جزئیات' : 'View details'),
    edit: t('professorDashboard.courses.edit', isRtl ? 'ویرایش' : 'Edit'),
    delete: t('professorDashboard.courses.delete', isRtl ? 'حذف' : 'Delete'),
    publish: t('professorDashboard.courses.publish', isRtl ? 'انتشار' : 'Publish'),
    unpublish: t('professorDashboard.courses.unpublish', isRtl ? 'پیش‌نویس' : 'Unpublish'),
    statusPublished: t('professorDashboard.courses.statusPublished', isRtl ? 'منتشر شده' : 'Published'),
    statusDraft: t('professorDashboard.courses.statusDraft', isRtl ? 'پیش‌نویس' : 'Draft'),
    statusPendingReview: t('professorDashboard.courses.statusPendingReview', isRtl ? 'در انتظار تأیید' : 'Pending review'),
    statusRejected: t('professorDashboard.courses.statusRejected', isRtl ? 'رد شده' : 'Rejected'),
    rejectionNoteTitle: t('professorDashboard.courses.rejectionNoteTitle', isRtl ? 'دلیل رد' : 'Rejection reason'),
  };

  React.useEffect(() => {
    if (searchParams.get('add') === '1') {
      setCourseToEdit(null);
      setModalOpen(true);
    }
  }, [searchParams]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, layout]);

  const loadCourses = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await searchProfessorCourses({
        inputValue: debouncedSearch,
        pageNumber: page,
        pageSize: PAGE_SIZE,
      });
      setCourses(data.queryResult);
      setTotalCount(data.totalCount);
    } catch {
      setCourses([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  React.useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const paginationRange = usePagination({ totalCount, pageSize: PAGE_SIZE, currentPage: page, siblingCount: 1 });

  const closeModal = () => {
    setModalOpen(false);
    setCourseToEdit(null);
    setLoadingEditCourse(false);
    router.replace('/professor/courses');
  };

  const openAddForm = () => {
    if (!requireVerifiedEmail()) return;
    setCourseToEdit(null);
    setModalOpen(true);
    router.replace('/professor/courses?add=1');
  };

  const openEditForm = async (courseId: number) => {
    setModalOpen(true);
    setCourseToEdit(null);
    setLoadingEditCourse(true);
    try {
      const detail = await getMyCourseById(courseId);
      if (!detail) {
        toast({
          title: t('professorDashboard.courses.editLoadError', isRtl ? 'بارگذاری دوره انجام نشد' : 'Could not load course'),
          variant: 'destructive',
        });
        closeModal();
        return;
      }
      setCourseToEdit(detail);
    } catch (error) {
      toast({
        title: getApiErrorMessage(
          error,
          t('professorDashboard.courses.editLoadError', isRtl ? 'بارگذاری دوره انجام نشد' : 'Could not load course')
        ),
        variant: 'destructive',
      });
      closeModal();
    } finally {
      setLoadingEditCourse(false);
    }
  };

  const handleSaved = () => {
    closeModal();
    loadCourses();
  };

  const handleDelete = async (course: CourseListItem) => {
    const confirmMessage = t(
      'professorDashboard.courses.deleteConfirm',
      isRtl ? 'این دوره حذف شود؟' : 'Delete this course?'
    );
    if (!window.confirm(confirmMessage)) return;

    setDeletingId(course.id);
    try {
      await deleteProfessorCourse(course.id);
      toast({
        title: t('professorDashboard.courses.deleted', isRtl ? 'دوره حذف شد' : 'Course deleted'),
      });
      await loadCourses();
    } catch (error) {
      toast({
        title: getApiErrorMessage(
          error,
          t('professorDashboard.courses.deleteError', isRtl ? 'حذف دوره انجام نشد' : 'Could not delete course')
        ),
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePublish = async (course: CourseListItem) => {
    if (!user?.id) return;

    const nextStatus = isProfessorCoursePublishRequested(course.status) ? 'Draft' : 'Published';
    setTogglingId(course.id);
    try {
      const detail = await getCourseById(course.id);
      if (!detail) {
        throw new Error(t('professorDashboard.courses.editLoadError', isRtl ? 'بارگذاری دوره انجام نشد' : 'Could not load course'));
      }

      const result = await toggleProfessorCoursePublish(course.id, user.id, nextStatus, detail);
      if (!result.ok) {
        throw new Error(result.message ?? t('professorDashboard.courses.toggleError', isRtl ? 'تغییر وضعیت انجام نشد' : 'Could not update status'));
      }

      toast({
        title:
          nextStatus === 'Published'
            ? t('professorDashboard.courses.pendingReviewHint', isRtl ? 'دوره برای تأیید مدیر ارسال شد' : 'Course submitted for admin review')
            : t('professorDashboard.courses.unpublished', isRtl ? 'دوره به پیش‌نویس تغییر کرد' : 'Course moved to draft'),
      });
      await loadCourses();
    } catch (error) {
      toast({
        title: getApiErrorMessage(
          error,
          t('professorDashboard.courses.toggleError', isRtl ? 'تغییر وضعیت انجام نشد' : 'Could not update status')
        ),
        variant: 'destructive',
      });
    } finally {
      setTogglingId(null);
    }
  };

  const renderCourseActions = (course: CourseListItem) => ({
    onEdit: () => void openEditForm(course.id),
    onDelete: () => void handleDelete(course),
    onTogglePublish: () => void handleTogglePublish(course),
    deleting: deletingId === course.id,
    togglingPublish: togglingId === course.id,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('professorDashboard.menu.courses', 'Course list')}</h1>
          <p className="mt-1 text-muted-foreground">
            {t('professorDashboard.courses.pageDescription', 'Manage courses you have created.')}
          </p>
        </div>
        <Button onClick={openAddForm}>
          <Plus className="h-4 w-4" />
          {t('professorDashboard.hero.addCourse', 'Add course')}
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground ltr:left-3 rtl:right-3" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('professorDashboard.courses.searchPlaceholder', 'Search your courses...')}
            className="ltr:pl-9 rtl:pr-9"
          />
        </div>
        <Tabs value={layout} onValueChange={(v) => setLayout(v as 'grid' | 'list')}>
          <TabsList>
            <TabsTrigger value="grid">
              <LayoutGrid className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="list">
              <List className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <div className={layout === 'grid' ? 'grid gap-5 sm:grid-cols-2 xl:grid-cols-3' : 'space-y-4'}>
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <Skeleton key={i} className={layout === 'grid' ? 'aspect-[4/3] w-full rounded-xl' : 'h-36 w-full rounded-xl'} />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          {t('professorDashboard.courses.empty', 'No courses yet. Create your first course.')}
        </div>
      ) : layout === 'grid' ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <ProfessorCourseCard
              key={course.id}
              course={course}
              href={`/professor/courses/${course.id}`}
              isRtl={isRtl}
              labels={labels}
              {...renderCourseActions(course)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <ProfessorCourseListRow
              key={course.id}
              course={course}
              href={`/professor/courses/${course.id}`}
              isRtl={isRtl}
              labels={labels}
              {...renderCourseActions(course)}
            />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setPage((p) => Math.max(1, p - 1));
                }}
                className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
            {paginationRange.map((item, idx) =>
              item === DOTS ? (
                <PaginationItem key={`dots-${idx}`}>
                  <span className="px-2">…</span>
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationLink
                    href="#"
                    isActive={item === page}
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(item as number);
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
                onClick={(e) => {
                  e.preventDefault();
                  setPage((p) => Math.min(totalPages, p + 1));
                }}
                className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}

      {loading && totalCount > 0 ? (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('professorDashboard.courses.loading', 'Loading...')}
        </div>
      ) : null}

      <ProfessorCourseForm
        variant="modal"
        open={modalOpen}
        courseToEdit={courseToEdit}
        loadingCourse={loadingEditCourse}
        onCancel={closeModal}
        onSaved={handleSaved}
      />
    </div>
  );
}
