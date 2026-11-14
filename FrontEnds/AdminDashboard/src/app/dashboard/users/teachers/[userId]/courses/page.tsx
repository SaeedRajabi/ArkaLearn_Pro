'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLanguage } from '@/components/language-provider';
import { asLongId, isValidLongId } from '@/lib/id';
import {
  searchTeacherUserCourses,
  type TeacherCourseListItem,
} from '@/services/admin-teachers-api.service';
import { AdminTableShell, type TableExportColumn } from '@/components/data-table';

export default function TeacherCoursesPage() {
  const params = useParams();
  const userId = asLongId(params.userId);
  const { t, locale } = useLanguage();
  const [courses, setCourses] = React.useState<TeacherCourseListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const textAlign = locale === 'fa' ? 'right' : 'left';

  React.useEffect(() => {
    if (!isValidLongId(userId)) {
      setLoading(false);
      setCourses([]);
      return;
    }
    setLoading(true);
    void searchTeacherUserCourses({ userId, pageNumber: 1, pageSize: 500 })
      .then((res) => setCourses(res.items))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, [userId]);

  React.useEffect(() => {
    setPage(1);
  }, [pageSize, courses.length]);

  const paginated = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return courses.slice(start, start + pageSize);
  }, [courses, page, pageSize]);

  const exportColumns = React.useMemo<TableExportColumn<TeacherCourseListItem>[]>(
    () => [
      { header: t('teacher_courses_col_title'), accessor: (row) => row.title },
      {
        header: t('teacher_courses_col_status'),
        accessor: (row) => row.status || '—',
      },
    ],
    [t]
  );

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/users/teachers">
          <ChevronLeft className="mr-2 h-4 w-4" />
          {t('portal_students_back')}
        </Link>
      </Button>

      <AdminTableShell
        title={t('teacher_courses_title')}
        locale={locale}
        t={t}
        totalCount={courses.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        exportFilenameBase="teacher-courses"
        exportTitle={t('teacher_courses_title')}
        exportColumns={exportColumns}
        exportRows={paginated}
        fetchAllExportRows={async () => courses}
        loading={loading}
        isEmpty={!loading && courses.length === 0}
        emptyMessage={t('teacher_courses_empty')}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{ textAlign }}>{t('teacher_courses_col_title')}</TableHead>
              <TableHead style={{ textAlign }}>{t('teacher_courses_col_status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <Link href={`/dashboard/courses/${c.id}`} className="hover:underline">
                    {c.title}
                  </Link>
                </TableCell>
                <TableCell>{c.status || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminTableShell>
    </div>
  );
}
