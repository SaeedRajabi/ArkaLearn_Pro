'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  getCourseEnrollments,
  type CourseEnrollmentItem,
} from '@/services/student-enrollments-api.service';
import {
  searchPortalStudents,
  type PortalStudentRow,
} from '@/services/portal-students-api.service';
import { DesktopLicenseManager } from '@/components/students/desktop-license-manager';
import { asLongId, isValidLongId } from '@/lib/id';

export default function PortalStudentDetailPage() {
  const params = useParams();
  const userId = asLongId(params.userId);
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const [student, setStudent] = React.useState<PortalStudentRow | null>(null);
  const [enrollments, setEnrollments] = React.useState<CourseEnrollmentItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!isValidLongId(userId)) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        const studentRes = await searchPortalStudents({ userId, pageNumber: 1, pageSize: 1 });
        if (cancelled) return;

        const studentRow = studentRes.items[0] ?? null;
        setStudent(studentRow);

        const enrollmentRes = await getCourseEnrollments({
          userId,
          studentId: studentRow?.studentId,
          pageNumber: 1,
          pageSize: 100,
          needTotalCount: true,
        });
        if (cancelled) return;
        setEnrollments(enrollmentRes.items);
      } catch {
        if (!cancelled) {
          setStudent(null);
          setEnrollments([]);
          toast({
            variant: 'destructive',
            title: t('validation_error_title'),
            description: t('portal_students_load_failed'),
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, t, toast]);

  const textAlign = locale === 'fa' ? 'right' : 'left';

  if (!isValidLongId(userId)) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-muted-foreground">{t('portal_students_load_failed')}</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard/users/students">{t('portal_students_back')}</Link>
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="-ms-2 mb-1" asChild>
            <Link href="/dashboard/users/students">
              <ChevronLeft className="h-4 w-4" />
              {t('portal_students_back')}
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight xs:text-3xl">
            {student?.fullName || student?.userName || t('portal_students_detail_title')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('portal_students_detail_description')}</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/remote-assist?studentUserId=${userId}`}>
            {t('action_remote_assist_history')}
          </Link>
        </Button>
      </div>

      {student && (
        <Card>
          <CardHeader>
            <CardTitle>{t('portal_students_profile_title')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            <div>
              <span className="text-muted-foreground">{t('userTable_col_email')}: </span>
              <span>{student.email || '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t('portal_students_col_phone')}: </span>
              <span>{student.phoneNumber || '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t('students_col_status')}: </span>
              <span className={student.isActive ? 'text-green-600' : 'text-amber-600'}>
                {student.isActive ? t('status_active') : t('status_inactive')}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">{t('portal_students_col_registered')}: </span>
              <span>{student.registeredAt || '—'}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('portal_students_enrollments_title')}</CardTitle>
          <CardDescription>{t('portal_students_enrollments_description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ textAlign }}>{t('students_col_course')}</TableHead>
                <TableHead style={{ textAlign }}>{t('portal_students_col_teacher')}</TableHead>
                <TableHead style={{ textAlign }}>{t('students_col_enrolled_at')}</TableHead>
                <TableHead style={{ textAlign }}>{t('students_col_status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    {t('portal_students_no_enrollments')}
                  </TableCell>
                </TableRow>
              ) : (
                enrollments.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.courseTitle || '—'}</TableCell>
                    <TableCell>{row.teacherName || '—'}</TableCell>
                    <TableCell>{row.enrollmentDateTime}</TableCell>
                    <TableCell>
                      <span className={row.isActive ? 'text-green-600' : 'text-amber-600'}>
                        {row.isActive
                          ? t('status_active')
                          : (t('course_enrollment_pending') ?? t('students_pending'))}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <DesktopLicenseManager userId={userId} studentId={student?.studentId} />
    </div>
  );
}
