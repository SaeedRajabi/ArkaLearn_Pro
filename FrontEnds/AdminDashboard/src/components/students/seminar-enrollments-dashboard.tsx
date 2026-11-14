'use client';

import React, { useEffect, useState } from 'react';
import { getAllSeminarRegistrations, type SeminarRegistrationItem } from '@/services/student-enrollments-api.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/components/language-provider';
import { Skeleton } from '@/components/ui/skeleton';

export function SeminarEnrollmentsDashboard() {
  const { t } = useLanguage();
  const [items, setItems] = useState<SeminarRegistrationItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAllSeminarRegistrations({ pageNumber: 1, pageSize: 100, needTotalCount: true })
      .then(({ items: list, totalCount: total }) => {
        if (!cancelled) {
          setItems(list);
          setTotalCount(total);
        }
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          {t('students_seminars_title')}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t('students_seminars_description')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('students_seminars_table_title')}</CardTitle>
          <CardDescription>
            {t('students_seminars_table_description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('userTable_col_name')}</TableHead>
                <TableHead>{t('userTable_col_email')}</TableHead>
                <TableHead>{t('students_col_seminar')}</TableHead>
                <TableHead>{t('students_col_registered_at')}</TableHead>
                <TableHead>{t('students_col_payment')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    {t('students_no_data')}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      {row.userFullName || row.userName || '-'}
                    </TableCell>
                    <TableCell>{row.email || '-'}</TableCell>
                    <TableCell>{row.seminarTitle || '-'}</TableCell>
                    <TableCell>{row.registeredAt}</TableCell>
                    <TableCell>
                      <Badge variant={row.hasPaid ? 'default' : 'secondary'}>
                        {row.hasPaid ? t('students_paid') : t('students_pending')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {totalCount > 0 && (
            <p className="text-sm text-muted-foreground mt-4">
              {t('students_total_count').replace('{count}', String(totalCount))}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
