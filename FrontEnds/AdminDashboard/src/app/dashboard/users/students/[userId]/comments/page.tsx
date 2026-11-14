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
import { searchUserCourseComments } from '@/services/admin-user-management-api.service';
import { AdminTableShell, type TableExportColumn } from '@/components/data-table';

type CommentRow = {
  id: number;
  courseTitle: string;
  commentText: string;
  createdAt: string;
  isApproved: boolean;
};

export default function StudentCommentsPage() {
  const params = useParams();
  const userId = asLongId(params.userId);
  const { t, locale } = useLanguage();
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [items, setItems] = React.useState<CommentRow[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const textAlign = locale === 'fa' ? 'right' : 'left';

  const exportColumns = React.useMemo<TableExportColumn<CommentRow>[]>(
    () => [
      { header: t('student_comments_col_course'), accessor: (row) => row.courseTitle },
      { header: t('student_comments_col_text'), accessor: (row) => row.commentText },
      {
        header: t('student_comments_col_status'),
        accessor: (row) => (row.isApproved ? t('status_approved') : t('status_pending')),
      },
    ],
    [t]
  );

  const fetchAllComments = React.useCallback(async () => {
    if (!isValidLongId(userId)) return [];
    const res = await searchUserCourseComments({
      userId,
      pageNumber: 1,
      pageSize: Math.max(totalCount, 1000),
    });
    return res.items;
  }, [userId, totalCount]);

  React.useEffect(() => {
    if (!isValidLongId(userId)) {
      setLoading(false);
      setItems([]);
      setTotalCount(0);
      return;
    }
    setLoading(true);
    void searchUserCourseComments({ userId, pageNumber: page, pageSize })
      .then((res) => {
        setItems(res.items);
        setTotalCount(res.totalCount);
      })
      .catch(() => {
        setItems([]);
        setTotalCount(0);
      })
      .finally(() => setLoading(false));
  }, [userId, page, pageSize]);

  React.useEffect(() => {
    setPage(1);
  }, [pageSize]);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/users/students">
          <ChevronLeft className="mr-2 h-4 w-4" />
          {t('portal_students_back')}
        </Link>
      </Button>

      <AdminTableShell
        title={t('student_comments_title')}
        locale={locale}
        t={t}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        exportFilenameBase="student-comments"
        exportTitle={t('student_comments_title')}
        exportColumns={exportColumns}
        exportRows={items}
        fetchAllExportRows={fetchAllComments}
        loading={loading}
        isEmpty={!loading && items.length === 0}
        emptyMessage={t('student_comments_empty')}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{ textAlign }}>{t('student_comments_col_course')}</TableHead>
              <TableHead style={{ textAlign }}>{t('student_comments_col_text')}</TableHead>
              <TableHead style={{ textAlign }}>{t('student_comments_col_status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.courseTitle}</TableCell>
                <TableCell className="max-w-md truncate">{row.commentText}</TableCell>
                <TableCell>{row.isApproved ? t('status_approved') : t('status_pending')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminTableShell>
    </div>
  );
}
