'use client';

import * as React from 'react';
import { Award, BookOpen, Loader2, MessageSquare, Trophy } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getExamForTaking, type ExamTaking } from '@/lib/api/student-exams';
import { ExamAnswerContent } from './exam-answer-content';
import { getDictValue } from '@/lib/i18n-client';
import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';
import type { Dictionary } from '@/types';

type Props = {
  open: boolean;
  attemptId: number | null;
  dict: Dictionary;
  onClose: () => void;
};

type ResultData = {
  title: string;
  courseTitle: string;
  status: number;
  finalScore: number | null;
  totalPoints: number;
  feedback: string | null;
  exam: ExamTaking | null;
};

export function StudentExamResultModal({ open, attemptId, dict, onClose }: Props) {
  const { locale } = useLanguage();
  const isRtl = locale === 'fa';
  const t = (key: string, fb: string) => getDictValue(dict, key, fb);
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<ResultData | null>(null);

  const resultTitle = t('dashboard.myExams.resultTitle', isRtl ? 'نتیجه آزمون' : 'Exam result');
  const closeLabel = t('dashboard.myExams.close', isRtl ? 'بستن' : 'Close');

  React.useEffect(() => {
    if (!open || !attemptId) {
      setData(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const { getMyAssignedExams } = await import('@/lib/api/student-exams');
        const list = await getMyAssignedExams();
        const item = list.find((x) => x.attemptId === attemptId);
        if (!item?.examId) {
          if (!cancelled) setData(null);
          return;
        }

        const taking = await getExamForTaking(item.examId);
        if (!cancelled) {
          setData({
            title: taking.title,
            courseTitle: taking.courseTitle,
            status: taking.attemptStatus,
            finalScore: taking.finalScore ?? item.finalScore ?? null,
            totalPoints: taking.totalPoints,
            feedback: taking.professorFeedback ?? null,
            exam: taking,
          });
        }
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, attemptId]);

  const statusLabel =
    data?.status === 4
      ? t('dashboard.myExams.graded', isRtl ? 'تصحیح شده' : 'Graded')
      : data?.status === 3
        ? t('dashboard.myExams.closed', isRtl ? 'بسته شده' : 'Closed')
        : t('dashboard.myExams.submitted', isRtl ? 'تحویل شده' : 'Submitted');

  const scorePct =
    data?.finalScore != null && data.totalPoints > 0
      ? Math.round((data.finalScore / data.totalPoints) * 100)
      : null;

  return (
    <Dialog open={open} onOpenChange={() => undefined}>
      <DialogContent
        hideCloseButton
        dir={isRtl ? 'rtl' : 'ltr'}
        className="flex max-h-[90vh] max-w-md flex-col gap-0 overflow-hidden rounded-3xl border-0 p-0 shadow-2xl"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{data?.title ?? resultTitle}</DialogTitle>
          <DialogDescription>
            {data?.courseTitle ?? resultTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 px-6 py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {t('dashboard.myExams.loadingResult', isRtl ? 'در حال بارگذاری نتیجه...' : 'Loading result...')}
              </p>
            </div>
          ) : data ? (
            <>
              <div className="relative bg-gradient-to-br from-primary via-primary to-primary/85 px-6 pb-16 pt-8 text-primary-foreground">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />
                <div className="relative space-y-3 text-start">
                  <Badge variant="secondary" className="w-fit border-0 bg-white/20 text-primary-foreground">
                    <BookOpen className="h-3.5 w-3.5" />
                    {data.courseTitle}
                  </Badge>
                  <h2 className="text-xl font-bold leading-snug text-primary-foreground sm:text-2xl">
                    {data.title}
                  </h2>
                  <p className="text-sm text-primary-foreground/80">{resultTitle}</p>
                </div>
              </div>

              <div className="relative -mt-10 px-6 pb-2">
                <div className="mx-auto flex max-w-[220px] flex-col items-center rounded-2xl border bg-card px-6 py-5 shadow-lg">
                  {data.finalScore != null ? (
                    <>
                      <div
                        className={cn(
                          'relative flex h-24 w-24 items-center justify-center rounded-full border-4',
                          scorePct != null && scorePct >= 70
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                            : scorePct != null && scorePct >= 50
                              ? 'border-amber-500/30 bg-amber-500/10 text-amber-600'
                              : 'border-primary/30 bg-primary/10 text-primary'
                        )}
                      >
                        <Trophy className="absolute -top-1 end-0 h-5 w-5 text-amber-500" />
                        <div className="text-center">
                          <p className="text-3xl font-bold tabular-nums">{data.finalScore}</p>
                          <p className="text-xs text-muted-foreground">/ {data.totalPoints}</p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm font-medium text-muted-foreground">
                        {t('dashboard.myExams.score', isRtl ? 'نمره شما' : 'Your score')}
                      </p>
                      {scorePct != null ? (
                        <Badge variant="outline" className="mt-2">
                          {scorePct}%
                        </Badge>
                      ) : null}
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-2 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                        <Award className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t('dashboard.myExams.awaitingGrade', isRtl ? 'در انتظار تصحیح استاد.' : 'Awaiting professor grading.')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 px-6 py-4">
                <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
                  <span className="text-sm text-muted-foreground">
                    {t('dashboard.myExams.status', isRtl ? 'وضعیت' : 'Status')}
                  </span>
                  <Badge>{statusLabel}</Badge>
                </div>

                {data.feedback ? (
                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      {t('dashboard.myExams.feedback', isRtl ? 'بازخورد استاد' : 'Professor feedback')}
                    </p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{data.feedback}</p>
                  </div>
                ) : null}

                {data.exam ? (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold">
                      {t('dashboard.myExams.answersReview', isRtl ? 'پاسخ شما به سوالات' : 'Your answers')}
                    </p>
                    {data.exam.questions.map((q, idx) => {
                      const answer = data.exam?.answers.find((a) => a.questionId === q.id);
                      const awarded = answer?.pointsAwarded;
                      let selectedText: string | null = null;
                      if (q.questionType !== 2 && answer?.selectedOptionIdsJson) {
                        try {
                          const ids = JSON.parse(answer.selectedOptionIdsJson) as number[];
                          selectedText =
                            q.options
                              .filter((o) => ids.includes(o.id))
                              .map((o) => o.text)
                              .join(isRtl ? '، ' : ', ') || null;
                        } catch {
                          selectedText = null;
                        }
                      }
                      return (
                        <div key={q.id} className="rounded-2xl border p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-medium">
                              {t('dashboard.myExams.questionLabel', isRtl ? 'سوال' : 'Question')} {idx + 1}
                            </p>
                            <Badge variant="secondary" className="gap-1">
                              <Award className="h-3 w-3" />
                              {awarded != null ? `${awarded} / ${q.points}` : `${q.points}`}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm leading-relaxed">{q.prompt}</p>
                          {q.questionType === 2 ? (
                            <div className="mt-3">
                              <ExamAnswerContent html={answer?.textAnswer} />
                            </div>
                          ) : (
                            <p className={cn('mt-2 text-sm', selectedText ? 'text-foreground' : 'text-muted-foreground')}>
                              {selectedText ?? '—'}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <div className="space-y-4 px-6 py-16 text-center">
              <p className="text-muted-foreground">
                {t('dashboard.myExams.resultNotFound', isRtl ? 'نتیجه آزمون یافت نشد.' : 'Exam result not found.')}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 border-t bg-muted/20 px-6 py-4 sm:justify-center">
          <Button className="h-11 w-full rounded-xl sm:max-w-xs" onClick={onClose}>
            {closeLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
