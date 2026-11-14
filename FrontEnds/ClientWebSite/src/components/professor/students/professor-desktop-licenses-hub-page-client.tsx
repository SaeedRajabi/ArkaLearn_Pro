'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  KeyRound,
  Loader2,
  Monitor,
  Search,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ProfessorDesktopLicensePanel } from '@/components/professor/students/professor-desktop-license-panel';
import { useLanguage } from '@/contexts/language-context';
import { searchProfessorCourses } from '@/lib/api/professor-courses';
import {
  searchProfessorStudents,
  type ProfessorStudent,
} from '@/lib/api/professor-students';
import { getDictValue } from '@/lib/i18n-client';
import type { Dictionary } from '@/types';
import { cn } from '@/lib/utils';

type Props = { dict: Dictionary };

type DesktopCourseCard = {
  id: number;
  title: string;
  studentCount: number;
};

export function ProfessorDesktopLicensesHubPageClient({ dict }: Props) {
  const { locale } = useLanguage();
  const isRtl = locale === 'fa';
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const t = (key: string, fallback: string) => getDictValue(dict, key, fallback);

  const [courses, setCourses] = React.useState<DesktopCourseCard[]>([]);
  const [coursesLoading, setCoursesLoading] = React.useState(true);
  const [studentQuery, setStudentQuery] = React.useState('');
  const [studentResults, setStudentResults] = React.useState<ProfessorStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = React.useState(false);
  const [licenseTarget, setLicenseTarget] = React.useState<ProfessorStudent | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      setCoursesLoading(true);
      try {
        const page = await searchProfessorCourses({ pageNumber: 1, pageSize: 100 });
        if (cancelled) return;
        setCourses(
          page.queryResult
            .filter((c) => c.deliveryMode === 'desktopLicense')
            .map((c) => ({
              id: Number(c.id),
              title: c.title,
              studentCount: Number(c.studentCount ?? 0),
            }))
            .filter((c) => c.id > 0)
        );
      } catch {
        if (!cancelled) setCourses([]);
      } finally {
        if (!cancelled) setCoursesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    const q = studentQuery.trim();
    if (q.length < 2) {
      setStudentResults([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        setStudentsLoading(true);
        try {
          const page = await searchProfessorStudents({
            search: q,
            pageNumber: 1,
            pageSize: 8,
          });
          if (!cancelled) setStudentResults(page.queryResult);
        } catch {
          if (!cancelled) setStudentResults([]);
        } finally {
          if (!cancelled) setStudentsLoading(false);
        }
      })();
    }, 320);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [studentQuery]);

  return (
    <div className={cn('space-y-8 pb-10', isRtl && 'text-right')}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Button asChild variant="ghost" size="sm" className="-ms-2 gap-1.5 text-muted-foreground">
            <Link href="/professor/students">
              <BackIcon className="h-4 w-4" />
              {t('professorDashboard.menu.students', isRtl ? 'لیست دانشجویان' : 'Student list')}
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('professorDashboard.menu.desktopLicenses', isRtl ? 'مدیریت لایسنس دسکتاپ' : 'Desktop license management')}
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            {isRtl
              ? 'از بخش دانشجویان و تعامل، لایسنس‌های آرکا دسکتاپ را برای دوره‌ها و دانشجویان خود مدیریت کنید.'
              : 'From Students & engagement, manage Arka desktop licenses for your courses and students.'}
          </p>
        </div>
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-emerald-900/10 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 px-6 py-7 text-white shadow-sm">
        <div
          className="pointer-events-none absolute inset-0 opacity-45"
          style={{
            backgroundImage:
              'radial-gradient(circle at 10% 20%, rgba(52,211,153,0.35), transparent 40%), radial-gradient(circle at 90% 15%, rgba(148,163,184,0.22), transparent 32%)',
          }}
        />
        <div className="relative grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-emerald-100">
              <KeyRound className="h-3.5 w-3.5" />
              {isRtl ? 'مرکز کنترل لایسنس' : 'License control center'}
            </div>
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {isRtl
                ? 'وضعیت، کلید، دستگاه و دسترسی محتوا — یک‌جا'
                : 'Status, keys, devices, and content access — in one place'}
            </h2>
            <p className="max-w-xl text-sm text-slate-300">
              {isRtl
                ? 'دوره دسکتاپ را باز کنید یا دانشجو را جستجو کنید تا لایسنس را فعال، ویرایش یا محدود کنید.'
                : 'Open a desktop course or search a student to activate, edit, or restrict their license.'}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <LabelSearch
              isRtl={isRtl}
              value={studentQuery}
              onChange={setStudentQuery}
              loading={studentsLoading}
            />
            <div className="mt-3 space-y-2">
              {studentQuery.trim().length >= 2 && !studentsLoading && studentResults.length === 0 ? (
                <p className="text-sm text-slate-300">
                  {isRtl ? 'دانشجویی یافت نشد.' : 'No students found.'}
                </p>
              ) : null}
              {studentResults.map((student) => (
                <button
                  key={`${student.userId}-${student.studentId}`}
                  type="button"
                  onClick={() => setLicenseTarget(student)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-start transition hover:bg-white/10"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{student.fullName}</span>
                    <span className="block truncate text-xs text-slate-300">
                      {student.email || student.userName || student.userId}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-1 text-xs text-emerald-100">
                    <Users className="h-3.5 w-3.5" />
                    {isRtl ? 'مدیریت' : 'Manage'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Monitor className="h-5 w-5 text-emerald-700" />
          <h3 className="text-lg font-semibold">
            {isRtl ? 'دوره‌های لایسنس دسکتاپ' : 'Desktop license courses'}
          </h3>
        </div>

        {coursesLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        ) : courses.length === 0 ? (
          <div className="rounded-2xl border border-dashed px-6 py-14 text-center">
            <Monitor className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="font-medium">
              {isRtl ? 'هنوز دوره دسکتاپ ندارید' : 'No desktop courses yet'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {isRtl
                ? 'در ساخت دوره، حالت تحویل را روی لایسنس دسکتاپ بگذارید.'
                : 'When creating a course, set delivery mode to desktop license.'}
            </p>
            <Button asChild className="mt-4">
              <Link href="/professor/courses">{isRtl ? 'رفتن به دوره‌ها' : 'Go to courses'}</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/professor/courses/${course.id}/desktop`}
                className="group rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:border-emerald-700/30 hover:shadow-md"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 transition group-hover:scale-105 dark:bg-emerald-950/40 dark:text-emerald-200">
                  <KeyRound className="h-5 w-5" />
                </div>
                <h4 className="line-clamp-2 font-semibold leading-snug">{course.title}</h4>
                <p className="mt-2 text-sm text-muted-foreground">
                  {course.studentCount} {isRtl ? 'دانشجو' : 'students'}
                </p>
                <p className="mt-4 text-sm font-medium text-emerald-800 dark:text-emerald-300">
                  {isRtl ? 'مدیریت لایسنس دوره ←' : 'Manage course licenses →'}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Dialog open={licenseTarget != null} onOpenChange={(open) => !open && setLicenseTarget(null)}>
        <DialogContent className="flex max-h-[92vh] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:rounded-2xl">
          <DialogHeader className="border-b px-6 py-4 text-start">
            <DialogTitle className="text-base sm:text-lg">
              {isRtl ? 'مدیریت لایسنس دسکتاپ' : 'Desktop license management'}
              {licenseTarget ? ` — ${licenseTarget.fullName}` : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto px-6 py-5">
            {licenseTarget ? (
              <ProfessorDesktopLicensePanel
                userId={licenseTarget.userId}
                studentName={licenseTarget.fullName}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LabelSearch({
  isRtl,
  value,
  onChange,
  loading,
}: {
  isRtl: boolean;
  value: string;
  onChange: (v: string) => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-emerald-50">
        {isRtl ? 'جستجوی دانشجو برای مدیریت لایسنس' : 'Search student to manage license'}
      </p>
      <div className="relative">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={isRtl ? 'نام، ایمیل یا نام کاربری…' : 'Name, email, or username…'}
          className="border-white/15 bg-white/10 pe-10 ps-9 text-white placeholder:text-slate-400"
        />
        {loading ? (
          <Loader2 className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-emerald-200" />
        ) : null}
      </div>
    </div>
  );
}
