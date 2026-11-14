'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLanguage } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import {
  searchAdminSupportTeachers,
  type AdminSupportTeacherRow,
} from '@/services/support-chat-admin-api.service';
import { AdminTableShell, type TableExportColumn } from '@/components/data-table';

export default function SupportManagementPage() {
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [list, setList] = React.useState<AdminSupportTeacherRow[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [navigatingTeacherUserId, setNavigatingTeacherUserId] = React.useState<string | null>(null);
  const router = useRouter();

  const exportColumns = React.useMemo<TableExportColumn<AdminSupportTeacherRow>[]>(
    () => [
      { header: t('admin_support_col_teacher'), accessor: (row) => row.displayName },
      { header: t('admin_support_col_students'), accessor: (row) => row.studentCount },
      { header: t('admin_support_col_topics'), accessor: (row) => row.conversationCount },
    ],
    [t]
  );

  const fetchAllTeachers = React.useCallback(async () => {
    const res = await searchAdminSupportTeachers({
      inputValue: debouncedSearch,
      pageNumber: 1,
      pageSize: Math.max(totalCount, 1000),
    });
    return res.items;
  }, [debouncedSearch, totalCount]);

  React.useEffect(() => {
    const tmr = window.setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => window.clearTimeout(tmr);
  }, [search]);

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await searchAdminSupportTeachers({
        inputValue: debouncedSearch,
        pageNumber: page,
        pageSize,
      });
      setList(res.items);
      setTotalCount(res.totalCount);
    } catch {
      toast({ variant: 'destructive', title: t('admin_support_load_failed') });
      setList([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, pageSize, t, toast]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const openTeacher = (teacher: AdminSupportTeacherRow) => {
    setNavigatingTeacherUserId(teacher.teacherUserId);
    router.push(
      `/dashboard/support-management/${teacher.teacherUserId}?name=${encodeURIComponent(teacher.displayName)}`,
    );
  };

  const textAlign = locale === 'fa' ? 'right' : 'left';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('admin_support_title')}</h1>
        <p className="text-muted-foreground">{t('admin_support_description')}</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="ps-9"
          placeholder={t('admin_support_search_placeholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <AdminTableShell
        title={t('admin_support_teachers_title')}
        description={t('admin_support_teachers_description')}
        locale={locale}
        t={t}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        exportFilenameBase="support-teachers"
        exportTitle={t('admin_support_teachers_title')}
        exportColumns={exportColumns}
        exportRows={list}
        fetchAllExportRows={fetchAllTeachers}
        loading={loading}
        isEmpty={!loading && list.length === 0}
        emptyMessage={t('admin_support_teachers_empty')}
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead style={{ textAlign }}>{t('admin_support_col_teacher')}</TableHead>
              <TableHead style={{ textAlign }}>{t('admin_support_col_students')}</TableHead>
              <TableHead style={{ textAlign }}>{t('admin_support_col_topics')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((teacher) => {
              const isNavigating = navigatingTeacherUserId === teacher.teacherUserId;
              return (
                <TableRow
                  key={teacher.teacherUserId}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => openTeacher(teacher)}
                >
                  <TableCell className="font-medium">
                    <span className="inline-flex items-center gap-2">
                      {isNavigating ? (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" aria-hidden />
                      ) : null}
                      {teacher.displayName}
                    </span>
                  </TableCell>
                  <TableCell>{teacher.studentCount}</TableCell>
                  <TableCell>{teacher.conversationCount}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </AdminTableShell>
    </div>
  );
}
