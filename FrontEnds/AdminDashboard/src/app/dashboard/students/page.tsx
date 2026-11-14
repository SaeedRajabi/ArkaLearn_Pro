'use client';

import * as React from 'react';
import { PlusCircle, Search, Loader2, Pencil, Trash2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/components/language-provider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
  deleteManagedRoomStudent,
  searchManagedRoomStudents,
  type ManagedRoomStudentRow,
} from '@/services/managed-room-students-service';
import { resolveUserAvatarUrl } from '@/lib/default-user-avatar';
import { AddManagedRoomStudentModal } from './components/add-managed-room-student-modal';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { AdminTableShell, type TableExportColumn } from '@/components/data-table';

function initials(row: ManagedRoomStudentRow): string {
  const a = (row.firstName?.[0] ?? '').toUpperCase();
  const b = (row.lastName?.[0] ?? '').toUpperCase();
  return (a + b) || '?';
}

export default function RoomStudentsPage() {
  const { t , locale} = useLanguage();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [studentToEdit, setStudentToEdit] = React.useState<ManagedRoomStudentRow | null>(null);
  const [studentToDelete, setStudentToDelete] = React.useState<ManagedRoomStudentRow | null>(null);
  const [deleteBusy, setDeleteBusy] = React.useState(false);
  const [list, setList] = React.useState<ManagedRoomStudentRow[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');

  React.useEffect(() => {
    const tmr = window.setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => window.clearTimeout(tmr);
  }, [search]);

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize]);

  const exportColumns = React.useMemo<TableExportColumn<ManagedRoomStudentRow>[]>(
    () => [
      {
        header: t('room_students_col_name'),
        accessor: (row) => `${row.firstName} ${row.lastName}`.trim(),
      },
      { header: t('room_students_col_username'), accessor: (row) => row.userName },
      { header: t('room_students_col_email'), accessor: (row) => row.email ?? '—' },
      { header: t('room_students_col_phone'), accessor: (row) => row.phone ?? '—' },
    ],
    [t]
  );

  const fetchAllStudents = React.useCallback(async () => {
    const res = await searchManagedRoomStudents({
      inputValue: debouncedSearch,
      pageNumber: 1,
      pageSize: Math.max(totalCount, 1000),
    });
    return res.list;
  }, [debouncedSearch, totalCount]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await searchManagedRoomStudents({
        inputValue: debouncedSearch,
        pageNumber: page,
        pageSize,
      });
      setList(res.list);
      setTotalCount(res.totalCount);
    } catch {
      setList([]);
      setTotalCount(0);
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t('room_students_load_failed'),
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, pageSize, t, toast]);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight xs:text-3xl">{t('room_students_title')}</h1>
          <p className="text-sm text-muted-foreground">{t('room_students_description')}</p>
        </div>
        <Button
          size="sm"
          className="xs:text-sm"
          onClick={() => {
            setStudentToEdit(null);
            setIsModalOpen(true);
          }}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('room_students_add_button')}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('room_students_search_placeholder')}
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <AdminTableShell
        title={t('room_students_table_title')}
        description={t('room_students_table_description')}
        locale={locale}
        t={t}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        exportFilenameBase="room-students"
        exportTitle={t('room_students_table_title')}
        exportColumns={exportColumns}
        exportRows={list}
        fetchAllExportRows={fetchAllStudents}
        loading={loading}
        isEmpty={!loading && list.length === 0}
        emptyMessage={t('room_students_empty')}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{textAlign: locale === 'fa' ? 'right' : 'left'}} className="w-[72px]">{t('room_students_col_photo')}</TableHead>
              <TableHead style={{textAlign: locale === 'fa' ? 'right' : 'left'}}>{t('room_students_col_name')}</TableHead>
              <TableHead style={{textAlign: locale === 'fa' ? 'right' : 'left'}} className="hidden md:table-cell">{t('room_students_col_username')}</TableHead>
              <TableHead style={{textAlign: locale === 'fa' ? 'right' : 'left'}} className="hidden lg:table-cell">{t('room_students_col_email')}</TableHead>
              <TableHead style={{textAlign: locale === 'fa' ? 'right' : 'left'}} className="hidden lg:table-cell">{t('room_students_col_phone')}</TableHead>
              <TableHead style={{textAlign: locale === 'fa' ? 'right' : 'left'}} className="text-right">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((row) => {
              const img = resolveUserAvatarUrl(row.photoUrl);
              return (
                <TableRow key={row.id}>
                  <TableCell>
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={img} alt="" />
                      <AvatarFallback>{initials(row)}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">
                    {row.firstName} {row.lastName}
                    <span className="mt-0.5 block text-xs text-muted-foreground md:hidden">{row.userName}</span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{row.userName}</TableCell>
                  <TableCell className="hidden lg:table-cell">{row.email ?? '—'}</TableCell>
                  <TableCell className="hidden lg:table-cell">{row.phone ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/students/${row.id}/files`}>
                          {t('room_students_manage_files')}
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        type="button"
                        aria-label={t('actions_edit')}
                        onClick={() => {
                          setStudentToEdit(row);
                          setIsModalOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                        type="button"
                        aria-label={t('actions_delete')}
                        onClick={() => setStudentToDelete(row)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </AdminTableShell>

      <AddManagedRoomStudentModal
        open={isModalOpen}
        studentToEdit={studentToEdit}
        onOpenChangeAction={(o) => {
          setIsModalOpen(o);
          if (!o) setStudentToEdit(null);
        }}
        onCreatedAction={() => void load()}
      />

      <AlertDialog
        open={!!studentToDelete}
        onOpenChange={(o) => {
          if (!o) setStudentToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('room_students_delete_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {studentToDelete
                ? t('room_students_delete_description', {
                    name: `${studentToDelete.firstName} ${studentToDelete.lastName} (${studentToDelete.userName})`,
                  })
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteBusy}>{t('actions_cancel')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteBusy}
              className={cn(buttonVariants({ variant: 'destructive' }))}
              onClick={(e) => {
                e.preventDefault();
                if (!studentToDelete) return;
                setDeleteBusy(true);
                void deleteManagedRoomStudent(studentToDelete.id)
                  .then(() => {
                    toast({
                      title: t('toast_settings_saved_title'),
                      description: t('room_students_deleted'),
                    });
                    setStudentToDelete(null);
                    void load();
                  })
                  .catch(() => {
                    toast({
                      variant: 'destructive',
                      title: t('validation_error_title'),
                      description: t('room_students_delete_failed'),
                    });
                  })
                  .finally(() => setDeleteBusy(false));
              }}
            >
              {deleteBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
              {t('actions_delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
