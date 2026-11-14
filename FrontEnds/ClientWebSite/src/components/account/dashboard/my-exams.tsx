'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BookOpen,
  CalendarClock,
  Clock,
  FileCheck,
  GraduationCap,
  Loader2,
  Play,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getMyAssignedExams, type AssignedExam } from '@/lib/api/student-exams';
import { getDictValue } from '@/lib/i18n-client';
import { useLanguage } from '@/contexts/language-context';
import { formatPickerInputDateTime } from '@/lib/utils/locale-format';
import { cn } from '@/lib/utils';
import type { Dictionary } from '@/types';
import { StudentExamResultModal } from '@/components/account/exams/student-exam-result-modal';

const STATUS: Record<number, { fa: string; en: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  0: { fa: 'آماده شروع', en: 'Ready', variant: 'outline' },
  1: { fa: 'در حال انجام', en: 'In progress', variant: 'default' },
  2: { fa: 'تحویل شده', en: 'Submitted', variant: 'secondary' },
  3: { fa: 'بسته شده', en: 'Closed', variant: 'destructive' },
  4: { fa: 'تصحیح شده', en: 'Graded', variant: 'secondary' },
};

const LEVEL_LABELS: Record<string, { fa: string; en: string }> = {
  beginner: { fa: 'مبتدی', en: 'Beginner' },
  intermediate: { fa: 'متوسط', en: 'Intermediate' },
  advanced: { fa: 'پیشرفته', en: 'Advanced' },
};

function ExamCard({
  exam,
  isRtl,
  t,
  locale,
  onViewResult,
}: {
  exam: AssignedExam;
  isRtl: boolean;
  t: (key: string, fb: string) => string;
  locale: string;
  onViewResult: (attemptId: number) => void;
}) {
  const st = STATUS[exam.attemptStatus] ?? STATUS[0];
  const canTake = exam.attemptStatus === 0 || exam.attemptStatus === 1;
  const canViewResult = exam.attemptId != null && exam.attemptStatus >= 2;
  const level = LEVEL_LABELS[exam.level.toLowerCase()] ?? { fa: exam.level, en: exam.level };

  return (
    <Card className="group overflow-hidden border-0 bg-card shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
      <div className="h-1.5 bg-gradient-to-r from-primary via-primary/70 to-primary/40" />
      <CardContent className="p-0">
        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={st.variant}>{isRtl ? st.fa : st.en}</Badge>
                <Badge variant="outline" className="font-normal">
                  {isRtl ? level.fa : level.en}
                </Badge>
              </div>
              <h3 className="text-lg font-bold leading-snug tracking-tight">{exam.title}</h3>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5 shrink-0" />
                {exam.courseTitle}
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <GraduationCap className="h-6 w-6" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            <div className="rounded-xl bg-muted/50 px-3 py-2.5">
              <p className="text-xs text-muted-foreground">{t('dashboard.myExams.deadline', isRtl ? 'مهلت' : 'Deadline')}</p>
              <p className="mt-0.5 flex items-center gap-1 font-medium tabular-nums">
                <CalendarClock className="h-3.5 w-3.5 text-primary" />
                <span className="truncate text-xs sm:text-sm">
                  {formatPickerInputDateTime(new Date(exam.endsAtUtc), locale)}
                </span>
              </p>
            </div>
            <div className="rounded-xl bg-muted/50 px-3 py-2.5">
              <p className="text-xs text-muted-foreground">{t('dashboard.myExams.minutes', isRtl ? 'مدت' : 'Duration')}</p>
              <p className="mt-0.5 flex items-center gap-1 font-semibold tabular-nums">
                <Clock className="h-3.5 w-3.5 text-primary" />
                {exam.durationMinutes} {t('dashboard.myExams.minutes', isRtl ? 'دقیقه' : 'min')}
              </p>
            </div>
            <div className="col-span-2 rounded-xl bg-muted/50 px-3 py-2.5 sm:col-span-1">
              <p className="text-xs text-muted-foreground">{t('dashboard.myExams.points', isRtl ? 'امتیاز' : 'Points')}</p>
              <p className="mt-0.5 text-lg font-bold text-primary">{exam.totalPoints}</p>
            </div>
          </div>

          {exam.finalScore != null ? (
            <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
              <span className="text-sm text-muted-foreground">{t('dashboard.myExams.score', isRtl ? 'نمره' : 'Score')}</span>
              <span className="text-xl font-bold text-primary">
                {exam.finalScore} <span className="text-sm font-normal text-muted-foreground">/ {exam.totalPoints}</span>
              </span>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 border-t bg-muted/20 p-4 sm:flex-row">
          {canTake ? (
            <Button asChild className="h-11 flex-1 rounded-xl shadow-md shadow-primary/15">
              <Link href={`/account/exams/${exam.examId}/take`}>
                <Play className="h-4 w-4" />
                {exam.attemptStatus === 1
                  ? t('dashboard.myExams.continue', isRtl ? 'ادامه آزمون' : 'Continue exam')
                  : t('dashboard.myExams.start', isRtl ? 'شروع آزمون' : 'Start exam')}
              </Link>
            </Button>
          ) : null}
          {canViewResult ? (
            <Button
              variant="outline"
              className="h-11 flex-1 rounded-xl"
              onClick={() => onViewResult(exam.attemptId!)}
            >
              <FileCheck className="h-4 w-4" />
              {t('dashboard.myExams.viewResult', isRtl ? 'مشاهده نتیجه' : 'View result')}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function MyExams({ dict }: { dict: Dictionary }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useLanguage();
  const isRtl = locale === 'fa';
  const t = (key: string, fb: string) => getDictValue(dict, key, fb);
  const [exams, setExams] = useState<AssignedExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [resultAttemptId, setResultAttemptId] = useState<number | null>(null);
  const [resultModalOpen, setResultModalOpen] = useState(false);

  const openResultModal = (attemptId: number) => {
    setResultAttemptId(attemptId);
    setResultModalOpen(true);
  };

  const closeResultModal = () => {
    setResultModalOpen(false);
    setResultAttemptId(null);
    if (searchParams.get('showResult')) {
      router.replace('/account?view=my-exams');
    }
  };

  useEffect(() => {
    const showResult = searchParams.get('showResult');
    if (showResult) {
      const id = Number(showResult);
      if (!Number.isNaN(id) && id > 0) openResultModal(id);
    }
  }, [searchParams]);

  useEffect(() => {
    getMyAssignedExams()
      .then(setExams)
      .catch(() => setExams([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full max-w-md rounded-2xl" />
        <div className="grid gap-5 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!exams.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed bg-muted/20 px-6 py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">{t('dashboard.myExams.title', isRtl ? 'امتحانات من' : 'My exams')}</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {t('dashboard.myExams.empty', isRtl ? 'امتحانی به شما اختصاص داده نشده است.' : 'No exams assigned to you.')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
        <div className="relative">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            {t('dashboard.myExams.title', isRtl ? 'امتحانات من' : 'My exams')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('dashboard.myExams.subtitle', isRtl ? 'امتحانات فعال و نتایج شما.' : 'Your assigned exams and results.')}
          </p>
        </div>
      </div>

      <div className={cn('grid gap-5', exams.length === 1 ? 'max-w-xl' : 'lg:grid-cols-2')}>
        {exams.map((exam) => (
          <ExamCard
            key={exam.examId}
            exam={exam}
            isRtl={isRtl}
            t={t}
            locale={locale}
            onViewResult={openResultModal}
          />
        ))}
      </div>

      <StudentExamResultModal
        open={resultModalOpen}
        attemptId={resultAttemptId}
        dict={dict}
        onClose={closeResultModal}
      />
    </div>
  );
}
