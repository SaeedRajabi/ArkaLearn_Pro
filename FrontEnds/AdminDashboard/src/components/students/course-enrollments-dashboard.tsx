'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { getCourseEnrollments, type CourseEnrollmentItem } from '@/services/student-enrollments-api.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLanguage } from '@/components/language-provider';
import { Skeleton } from '@/components/ui/skeleton';

export function CourseEnrollmentsDashboard({ courseId }: { courseId?: string }) {
  const { t } = useLanguage();
  const [items, setItems] = useState<CourseEnrollmentItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadEnrollments = useCallback(async () => {
    const idParam = courseId ? Number(courseId) : undefined;
    const { items: list, totalCount: total } = await getCourseEnrollments({
      courseId: idParam,
      pageNumber: 1,
      pageSize: 100,
      needTotalCount: true,
    });
    setItems(list);
    setTotalCount(total);
  }, [courseId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadEnrollments()
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [loadEnrollments]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadEnrollments().catch(() => undefined);
    }, 15000);
    return () => window.clearInterval(timer);
  }, [loadEnrollments]);

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
      <Card>
        <CardHeader>
          <CardTitle>{t('students_courses_table_title')}</CardTitle>
          <CardDescription>
            {t('students_courses_table_description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('userTable_col_name')}</TableHead>
                <TableHead>{t('userTable_col_email')}</TableHead>
                <TableHead>{t('students_col_enrolled_at')}</TableHead>
                <TableHead>{t('students_col_status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
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
                    <TableCell>{row.enrollmentDateTime}</TableCell>
                    <TableCell>
                      <span className={row.isActive ? 'text-green-600' : 'text-amber-600'}>
                        {row.isActive
                          ? t('status_active')
                          : (t('course_enrollment_pending') ?? 'Pending approval')}
                      </span>
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
