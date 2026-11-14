'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { useLanguage } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import type { TrainingPlan } from '@/lib/types';
import { deleteTrainingPlan } from '@/services/training-plan-service';
import { PlanFormDialog } from './plan-form-dialog';
import { AdminTableShell, type TableExportColumn } from '@/components/data-table';

type Props = {
  plans: TrainingPlan[];
  onRefresh: () => void | Promise<void>;
};

export function PlansTable({ plans, onRefresh }: Props) {
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const [editing, setEditing] = useState<TrainingPlan | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const align = locale === 'fa' ? 'text-right' : 'text-left';

  const formatHours = (minutes?: number) => {
    const m = minutes ?? 0;
    const h = Math.floor(m / 60);
    const min = m % 60;
    if (h > 0 && min > 0) return `${h}h ${min}m`;
    if (h > 0) return `${h}h`;
    return `${min}m`;
  };

  const sorted = useMemo(
    () => [...plans].sort((a, b) => (b.startDateUtc ?? '').localeCompare(a.startDateUtc ?? '')),
    [plans]
  );

  const paginatedPlans = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [pageSize, sorted.length]);

  const exportColumns = useMemo<TableExportColumn<TrainingPlan>[]>(
    () => [
      { header: t('planTable_col_title'), accessor: (row) => row.title },
      { header: t('education_plan_student_label'), accessor: (row) => row.studentFullName ?? '—' },
      { header: t('education_plan_room_label'), accessor: (row) => row.roomTitle ?? '—' },
      {
        header: t('education_plan_remaining_hours'),
        accessor: (row) => `${formatHours(row.remainingMinutes)} / ${row.totalHours}h`,
      },
    ],
    [t]
  );

  const handleDelete = async (plan: TrainingPlan) => {
    if (!window.confirm(t('education_plan_delete_confirm'))) return;
    try {
      await deleteTrainingPlan(Number(plan.id));
      toast({ title: t('plan_deleted_title'), description: plan.title });
      await onRefresh();
    } catch {
      toast({ variant: 'destructive', title: t('validation_error_title'), description: t('toast_error_description') });
    }
  };

  return (
    <>
      <AdminTableShell
        title={t('planTable_title')}
        description={t('education_plan_table_description')}
        locale={locale}
        t={t}
        totalCount={sorted.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        exportFilenameBase="education-plans"
        exportTitle={t('planTable_title')}
        exportColumns={exportColumns}
        exportRows={paginatedPlans}
        fetchAllExportRows={async () => sorted}
        isEmpty={sorted.length === 0}
        emptyMessage={t('education_plan_empty')}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={align}>{t('planTable_col_title')}</TableHead>
              <TableHead className={align}>{t('education_plan_student_label')}</TableHead>
              <TableHead className={align}>{t('education_plan_room_label')}</TableHead>
              <TableHead className={align}>{t('education_plan_remaining_hours')}</TableHead>
              <TableHead className={align}>{t('planTable_col_actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPlans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell className={`font-medium ${align}`}>
                  <Link href={`/dashboard/education-plans/${plan.id}`} className="hover:underline">
                    {plan.title}
                  </Link>
                </TableCell>
                <TableCell className={align}>{plan.studentFullName ?? '—'}</TableCell>
                <TableCell className={align}>{plan.roomTitle ?? '—'}</TableCell>
                <TableCell className={align}>
                  {formatHours(plan.remainingMinutes)} / {plan.totalHours}h
                </TableCell>
                <TableCell className={align}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={locale === 'fa' ? 'start' : 'end'}>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/education-plans/${plan.id}`}>{t('room_details_details_button')}</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditing(plan)}>{t('actions_edit')}</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => void handleDelete(plan)}>
                        {t('actions_delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminTableShell>
      <PlanFormDialog
        open={editing != null}
        onOpenChange={(o) => !o && setEditing(null)}
        plan={editing}
        onSaved={async () => {
          await onRefresh();
        }}
      />
    </>
  );
}
