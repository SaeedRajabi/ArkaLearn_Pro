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
  searchStudentQaItems,
  type StudentQaItem,
} from '@/services/admin-user-management-api.service';
import { AdminTableShell, type TableExportColumn } from '@/components/data-table';

export default function StudentQaPage() {
  const params = useParams();
  const userId = asLongId(params.userId);
  const { t, locale } = useLanguage();
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [items, setItems] = React.useState<StudentQaItem[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const textAlign = locale === 'fa' ? 'right' : 'left';

  const contextLabel = (row: StudentQaItem) => {
    if (row.kind === 'community') return t('student_qa_kind_community');
    return row.contextTitle || '—';
  };

  const statusLabel = (row: StudentQaItem) => {
    if (row.kind === 'community') return t('student_qa_status_published');
    return row.status;
  };

  const exportColumns = React.useMemo<TableExportColumn<StudentQaItem>[]>(
    () => [
      { header: t('student_qa_col_project'), accessor: (row) => contextLabel(row) },
      { header: t('student_qa_col_subject'), accessor: (row) => row.subject || '—' },
      { header: t('student_qa_col_status'), accessor: (row) => statusLabel(row) },
    ],
    [t]
  );

  const fetchAll = React.useCallback(async () => {
    if (!isValidLongId(userId)) return [];
    const res = await searchStudentQaItems({
      userId,
      pageNumber: 1,
      pageSize: Math.max(totalCount, 1000),
    });
    return res.items;
  }, [userId, totalCount]);

  React.useEffect(() => {
    setPage(1);
  }, [pageSize]);

  React.useEffect(() => {
    if (!isValidLongId(userId)) {
      setLoading(false);
      setItems([]);
      setTotalCount(0);
      return;
    }
    setLoading(true);
    void searchStudentQaItems({
      userId,
      pageNumber: page,
      pageSize,
    })
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

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/users/students">
          <ChevronLeft className="mr-2 h-4 w-4" />
          {t('portal_students_back')}
        </Link>
      </Button>

      <AdminTableShell
        title={t('student_qa_title')}
        locale={locale}
        t={t}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        exportFilenameBase="student-qa"
        exportTitle={t('student_qa_title')}
        exportColumns={exportColumns}
        exportRows={items}
        fetchAllExportRows={fetchAll}
        loading={loading}
        isEmpty={!loading && items.length === 0}
        emptyMessage={t('student_qa_empty')}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{ textAlign }}>{t('student_qa_col_project')}</TableHead>
              <TableHead style={{ textAlign }}>{t('student_qa_col_subject')}</TableHead>
              <TableHead style={{ textAlign }}>{t('student_qa_col_status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((row) => (
              <TableRow key={`${row.kind}-${row.id}`}>
                <TableCell>{contextLabel(row)}</TableCell>
                <TableCell>{row.subject || '—'}</TableCell>
                <TableCell>{statusLabel(row)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminTableShell>
    </div>
  );
}
