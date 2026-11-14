
'use client';

import * as React from 'react';
import { MoreHorizontal } from 'lucide-react';
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
import { useLanguage } from '@/components/language-provider';
import { useStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { AddPlanModal } from './add-plan-modal';
import type { TrainingPlan } from '@/lib/types';
import Link from 'next/link';
import { AdminTableShell, type TableExportColumn } from '@/components/data-table';

export function PlanTable() {
  const { t , locale } = useLanguage();
  const { trainingPlans, deletePlan } = useStore();
  const { toast } = useToast();
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [editingPlan, setEditingPlan] = React.useState<TrainingPlan | null>(null);

  const currentPlans = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return trainingPlans.slice(start, start + pageSize);
  }, [trainingPlans, page, pageSize]);

  React.useEffect(() => {
    setPage(1);
  }, [pageSize, trainingPlans.length]);

  const exportColumns = React.useMemo<TableExportColumn<TrainingPlan>[]>(
    () => [
      { header: t('planTable_col_title'), accessor: (row) => row.title },
      { header: t('planTable_col_hourly_rate'), accessor: (row) => row.hourlyRate.toFixed(2) },
      { header: t('planTable_col_total_hours'), accessor: (row) => row.totalHours },
      { header: t('planTable_col_total_amount'), accessor: (row) => row.totalAmount.toFixed(2) },
    ],
    [t]
  );

  const handleDelete = (id: string, title: string) => {
    deletePlan(id);
    toast({
      title: t('plan_deleted_title'),
      description: t('plan_deleted_description').replace('{title}', title),
    });
  };

  const handleEdit = (plan: TrainingPlan) => {
    setEditingPlan(plan);
  };

  return (
    <>
      <AdminTableShell
        title={t('planTable_title')}
        description={t('planTable_description')}
        locale={locale}
        t={t}
        totalCount={trainingPlans.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        exportFilenameBase="training-plans"
        exportTitle={t('planTable_title')}
        exportColumns={exportColumns}
        exportRows={currentPlans}
        fetchAllExportRows={async () => trainingPlans}
        isEmpty={trainingPlans.length === 0}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{textAlign: locale === 'fa' ? 'right' : 'left'}}>{t('planTable_col_title')}</TableHead>
              <TableHead style={{textAlign: locale === 'fa' ? 'right' : 'left'}} className="hidden sm:table-cell">{t('planTable_col_hourly_rate')}</TableHead>
              <TableHead style={{textAlign: locale === 'fa' ? 'right' : 'left'}} className="hidden md:table-cell">{t('planTable_col_total_hours')}</TableHead>
              <TableHead style={{textAlign: locale === 'fa' ? 'right' : 'left'}} className="hidden lg:table-cell">{t('planTable_col_total_amount')}</TableHead>
              <TableHead style={{textAlign: locale === 'fa' ? 'right' : 'left'}}>
                <span className="sr-only">{t('planTable_col_actions')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentPlans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">
                  <Link href={`/dashboard/courses/plans/${plan.id}`} className="hover:underline">
                    {plan.title}
                  </Link>
                </TableCell>
                <TableCell className="hidden sm:table-cell">${plan.hourlyRate.toFixed(2)}</TableCell>
                <TableCell className="hidden md:table-cell">{plan.totalHours}</TableCell>
                <TableCell className="hidden lg:table-cell">${plan.totalAmount.toFixed(2)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">{t('actions_toggle_menu')}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleEdit(plan)}>{t('actions_edit')}</DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(plan.id, plan.title)}
                        className="text-destructive"
                      >
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
      {editingPlan && (
        <AddPlanModal
          open={!!editingPlan}
          onOpenChangeAction={(isOpen) => !isOpen && setEditingPlan(null)}
          plan={editingPlan}
        />
      )}
    </>
  );
}
