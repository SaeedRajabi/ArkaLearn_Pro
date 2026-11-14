
'use client';

import * as React from 'react';
import { MoreHorizontal, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import { formatAdminDateTime } from '@/lib/utils/localized-dates';
import { deleteSeminarPermanently, searchSeminars } from '@/services/seminar-api.service';
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
import { buttonVariants } from '@/components/ui/button';
import { AddSeminarModal } from './add-seminar-modal';
import type { Seminar } from '@/lib/types';
import { AdminTableShell, type TableExportColumn } from '@/components/data-table';

type SeminarTableProps = {
  refreshKey?: number;
};

export function SeminarTable({ refreshKey = 0 }: SeminarTableProps) {
  const { t , locale } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();
  const [seminars, setSeminars] = React.useState<Seminar[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [totalCount, setTotalCount] = React.useState(0);
  const [editingSeminar, setEditingSeminar] = React.useState<Seminar | null>(null);
  const [refetchCounter, setRefetchCounter] = React.useState(0);
  const [navigatingId, setNavigatingId] = React.useState<string | null>(null);
  const [seminarToDelete, setSeminarToDelete] = React.useState<Seminar | null>(null);
  const [deleteBusy, setDeleteBusy] = React.useState(false);

  const exportColumns = React.useMemo<TableExportColumn<Seminar>[]>(
    () => [
      { header: t('seminarTable_col_title'), accessor: (row) => row.title },
      { header: t('seminarTable_col_status'), accessor: (row) => t(row.status.toLowerCase()) },
      {
        header: t('seminarTable_col_date'),
        accessor: (row) => formatAdminDateTime(row.date, locale),
      },
      { header: t('seminarTable_col_location'), accessor: (row) => row.location },
    ],
    [t, locale]
  );

  const fetchAllSeminars = React.useCallback(async () => {
    const result = await searchSeminars({
      pageNumber: 1,
      pageSize: Math.max(totalCount, 1000),
      needTotalCount: true,
      skipCount: 0,
    });
    return result.items;
  }, [totalCount]);

  const goToSeminar = React.useCallback(
    (e: React.MouseEvent, seminarId: string) => {
      e.preventDefault();
      if (navigatingId) return;
      setNavigatingId(seminarId);
      router.push(`/dashboard/seminars/${seminarId}`);
    },
    [navigatingId, router]
  );

  React.useEffect(() => {
    setCurrentPage(1);
  }, [refreshKey, pageSize]);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    searchSeminars({
      pageNumber: currentPage,
      pageSize,
      needTotalCount: true,
      skipCount: (currentPage - 1) * pageSize,
    })
      .then((res) => {
        if (!cancelled) {
          setSeminars(res.items);
          setTotalCount(res.totalCount);
        }
      })
      .catch(() => {
        if (!cancelled) setSeminars([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [currentPage, pageSize, refreshKey, refetchCounter]);

  const confirmPermanentDelete = async () => {
    if (!seminarToDelete) return;
    setDeleteBusy(true);
    try {
      await deleteSeminarPermanently(seminarToDelete.id);
      setSeminars((prev) => prev.filter((s) => s.id !== seminarToDelete.id));
      toast({
        title: t('permanent_delete_success_title'),
        description: t('permanent_delete_success_description').replace('{name}', seminarToDelete.title),
      });
      setSeminarToDelete(null);
      setRefetchCounter((c) => c + 1);
    } catch {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t('permanent_delete_failed'),
      });
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleEdit = (seminar: Seminar) => {
    setEditingSeminar(seminar);
  };

  return (
    <>
      <AdminTableShell
        title={t('seminarTable_title')}
        description={t('seminarTable_description')}
        locale={locale}
        t={t}
        totalCount={totalCount}
        page={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        exportFilenameBase="seminars"
        exportTitle={t('seminarTable_title')}
        exportColumns={exportColumns}
        exportRows={seminars}
        fetchAllExportRows={fetchAllSeminars}
        loading={loading}
        isEmpty={!loading && seminars.length === 0}
      >
        <Table className={navigatingId ? 'cursor-wait' : ''}>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead style={{textAlign: locale==='fa' ? 'right' : 'left'}}>{t('seminarTable_col_title')}</TableHead>
              <TableHead style={{textAlign: locale==='fa' ? 'right' : 'left'}}>{t('seminarTable_col_status')}</TableHead>
              <TableHead style={{textAlign: locale==='fa' ? 'right' : 'left'}} className="hidden md:table-cell">{t('seminarTable_col_date')}</TableHead>
              <TableHead style={{textAlign: locale==='fa' ? 'right' : 'left'}} className="hidden lg:table-cell">{t('seminarTable_col_location')}</TableHead>
              <TableHead style={{textAlign: locale==='fa' ? 'right' : 'left'}}>
                <span className="sr-only">{t('seminarTable_col_actions')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {seminars.map((seminar) => (
              <TableRow
                key={seminar.id}
                className={cn(
                  'transition-colors',
                  navigatingId === seminar.id ? 'cursor-wait' : 'cursor-pointer hover:bg-muted/30'
                )}
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.closest('button') || target.closest('[role="menuitem"]')) return;
                  goToSeminar(e, seminar.id);
                }}
              >
                <TableCell className="font-medium">
                  <span
                    role="link"
                    tabIndex={0}
                    className="hover:underline focus:outline-none focus:underline"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        goToSeminar(e as unknown as React.MouseEvent, seminar.id);
                      }
                    }}
                  >
                    {navigatingId === seminar.id ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {seminar.title}
                      </span>
                    ) : (
                      seminar.title
                    )}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      seminar.status === 'Upcoming'
                        ? 'default'
                        : seminar.status === 'Completed'
                        ? 'secondary'
                        : 'destructive'
                    }
                    className={cn(
                      seminar.status === 'Upcoming' &&
                        'bg-accent text-accent-foreground'
                    )}
                  >
                    {t(seminar.status.toLowerCase())}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {formatAdminDateTime(seminar.date, locale)}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {seminar.location}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        aria-haspopup="true"
                        size="icon"
                        variant="ghost"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">
                          {t('actions_toggle_menu')}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                       <DropdownMenuItem onClick={() => handleEdit(seminar)}>
                        {t('actions_edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          goToSeminar(e as unknown as React.MouseEvent, seminar.id);
                        }}
                      >
                        {navigatingId === seminar.id ? (
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t('actions_view_details')}
                          </span>
                        ) : (
                          t('actions_view_details')
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        {t('actions_view_attendees')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setSeminarToDelete(seminar)}
                      >
                        {t('actions_delete_permanently')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminTableShell>

      <AlertDialog open={!!seminarToDelete} onOpenChange={(o) => !o && setSeminarToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('permanent_delete_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {seminarToDelete
                ? t('permanent_delete_description', { name: seminarToDelete.title })
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
                void confirmPermanentDelete();
              }}
            >
              {deleteBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('actions_delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddSeminarModal
        open={!!editingSeminar}
        onOpenChangeAction={(isOpen) => !isOpen && setEditingSeminar(null)}
        seminar={editingSeminar}
        onSuccessAction={() => {
          setEditingSeminar(null);
          setRefetchCounter((c) => c + 1);
        }}
      />
    </>
  );
}
