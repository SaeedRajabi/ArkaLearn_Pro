'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  ClipboardList,
  Clock,
  FileText,
  ListChecks,
  Loader2,
  Play,
  Send,
  Timer,
  Trophy,
  ClipboardPaste,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExamQuestionCodeBlock } from '@/components/shared/exam-question-code-block';
import { hasExamAnswerContent } from './exam-answer-content';
import { ExamAnswerEditor } from './exam-answer-editor';
import { uploadCommunityQaImage, uploadCommunityQaAudio } from '@/lib/api/community-discussions';
import {
  abandonExamAttempt,
  getExamForTaking,
  saveExamAnswers,
  startExamAttempt,
  submitExamAttempt,
  type ExamTaking,
  type ExamTakingQuestion,
} from '@/lib/api/student-exams';
import { getDictValue } from '@/lib/i18n-client';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Dictionary } from '@/types';

type Props = { dict: Dictionary; examId: number };

type AnswerState = Record<number, { optionIds: number[]; textAnswer: string }>;

const OPTION_LABELS_FA = ['الف', 'ب', 'ج', 'د', 'ه', 'و'];

const QUESTION_TYPE_META: Record<number, { fa: string; en: string; icon: typeof ListChecks }> = {
  0: { fa: 'چهارگزینه‌ای', en: 'Multiple choice', icon: ListChecks },
  1: { fa: 'صحیح / غلط', en: 'True / False', icon: CheckCircle2 },
  2: { fa: 'تشریحی', en: 'Short answer', icon: FileText },
};

function toPayload(answers: AnswerState, pasteCounts: Record<number, number>) {
  return Object.entries(answers).map(([questionId, v]) => ({
    questionId: Number(questionId),
    selectedOptionIdsJson: v.optionIds.length ? JSON.stringify(v.optionIds) : null,
    textAnswer: v.textAnswer?.trim() || null,
    pasteCount: pasteCounts[Number(questionId)] ?? 0,
  }));
}

function isQuestionAnswered(q: ExamTakingQuestion, answers: AnswerState): boolean {
  const a = answers[q.id];
  if (!a) return false;
  if (q.questionType === 2) return hasExamAnswerContent(a.textAnswer);
  return a.optionIds.length > 0;
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function ExamPageShell({ children, isRtl }: { children: React.ReactNode; isRtl: boolean }) {
  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 end-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 start-0 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
      </div>
      <div className="relative mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
    </div>
  );
}

export function StudentExamTakePageClient({ dict, examId }: Props) {
  const router = useRouter();
  const { locale } = useLanguage();
  const isRtl = locale === 'fa';
  const { toast } = useToast();
  const t = (key: string, fb: string) => getDictValue(dict, key, fb);

  const [exam, setExam] = React.useState<ExamTaking | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [starting, setStarting] = React.useState(false);
  const [started, setStarted] = React.useState(false);
  const [expiresAt, setExpiresAt] = React.useState<Date | null>(null);
  const [remainingSec, setRemainingSec] = React.useState(0);
  const [answers, setAnswers] = React.useState<AnswerState>({});
  const [pasteCounts, setPasteCounts] = React.useState<Record<number, number>>({});
  const pasteWarnedRef = React.useRef<Set<number>>(new Set());
  const [submitting, setSubmitting] = React.useState(false);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const abandonSent = React.useRef(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getExamForTaking(examId);
      setExam(data);
      const initial: AnswerState = {};
      const initialPasteCounts: Record<number, number> = {};
      data.answers.forEach((a) => {
        let optionIds: number[] = [];
        try {
          optionIds = JSON.parse(a.selectedOptionIdsJson || '[]') as number[];
        } catch { /* ignore */ }
        initial[a.questionId] = { optionIds, textAnswer: a.textAnswer ?? '' };
        initialPasteCounts[a.questionId] = a.pasteCount ?? 0;
      });
      data.questions.forEach((q) => {
        if (!initial[q.id]) initial[q.id] = { optionIds: [], textAnswer: '' };
      });
      setAnswers(initial);
      setPasteCounts(initialPasteCounts);
      if (data.attemptStatus === 1 && data.expiresAtUtc) {
        setStarted(true);
        setExpiresAt(new Date(data.expiresAtUtc));
      }
      if (data.attemptStatus >= 2) {
        // Auto-open the result only once the professor has graded the attempt.
        router.replace(
          data.attemptStatus === 4
            ? `/account?view=my-exams&showResult=${data.attemptId}`
            : '/account?view=my-exams'
        );
      }
    } catch {
      setExam(null);
    } finally {
      setLoading(false);
    }
  }, [examId, router]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const handlePasteDetected = React.useCallback((questionId: number) => {
    setPasteCounts((prev) => ({ ...prev, [questionId]: (prev[questionId] ?? 0) + 1 }));
    if (!pasteWarnedRef.current.has(questionId)) {
      pasteWarnedRef.current.add(questionId);
      toast({
        title: t(
          'dashboard.myExams.pasteTracked',
          isRtl
            ? 'چسباندن متن ثبت شد و در تصحیح به استاد نمایش داده می‌شود.'
            : 'Pasted text was recorded and will be shown to your teacher.'
        ),
      });
    }
  }, [toast, t, isRtl]);

  const handleSubmit = React.useCallback(async (auto = false) => {
    if (!exam || submitting) return;
    setSubmitting(true);
    try {
      await submitExamAttempt(exam.attemptId, toPayload(answers, pasteCounts));
      abandonSent.current = true;
      if (!auto) {
        toast({ title: t('dashboard.myExams.submitted', isRtl ? 'آزمون تحویل شد.' : 'Exam submitted.') });
      }
      // Result becomes visible only after the professor grades the attempt —
      // do not open the result modal right after submission.
      router.replace('/account?view=my-exams');
    } catch (e) {
      toast({ variant: 'destructive', title: e instanceof Error ? e.message : t('dashboard.myExams.error', 'Error') });
      setSubmitting(false);
    }
  }, [exam, submitting, answers, pasteCounts, router, toast, t, isRtl]);

  React.useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const sec = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      setRemainingSec(sec);
      if (sec <= 0 && started && exam && !submitting) {
        void handleSubmit(true);
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt, started, exam, submitting, handleSubmit]);

  React.useEffect(() => {
    if (!started || !exam) return;
    const id = window.setInterval(() => {
      void saveExamAnswers(exam.attemptId, toPayload(answers, pasteCounts)).catch(() => undefined);
    }, 30000);
    return () => window.clearInterval(id);
  }, [started, exam, answers, pasteCounts]);

  const sendAbandon = React.useCallback(() => {
    if (!exam || abandonSent.current || exam.attemptStatus >= 2) return;
    abandonSent.current = true;
    void abandonExamAttempt(exam.attemptId);
  }, [exam]);

  React.useEffect(() => {
    if (!started) return;
    const onLeave = () => sendAbandon();
    const onHide = () => {
      if (document.visibilityState === 'hidden') sendAbandon();
    };
    window.addEventListener('beforeunload', onLeave);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('beforeunload', onLeave);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [started, sendAbandon]);

  const handleStart = async () => {
    if (!exam || starting) return;
    setStarting(true);
    try {
      const res = await startExamAttempt(examId);
      setStarted(true);
      setExpiresAt(new Date(res.expiresAtUtc));
      setExam((prev) => (prev ? { ...prev, attemptStatus: 1, expiresAtUtc: res.expiresAtUtc } : prev));
    } catch (e) {
      toast({ variant: 'destructive', title: e instanceof Error ? e.message : t('dashboard.myExams.error', 'Error') });
    } finally {
      setStarting(false);
    }
  };

  const answeredCount = exam?.questions.filter((q) => isQuestionAnswered(q, answers)).length ?? 0;
  const totalQuestions = exam?.questions.length ?? 0;
  const progressPct = totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const timerPct = exam ? Math.min(100, (remainingSec / (exam.durationMinutes * 60)) * 100) : 100;
  const isUrgent = remainingSec > 0 && remainingSec < 120;

  const currentQuestion = exam?.questions[currentIndex];

  if (loading) {
    return (
      <ExamPageShell isRtl={isRtl}>
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('dashboard.myExams.loading', isRtl ? 'در حال بارگذاری آزمون...' : 'Loading exam...')}
          </p>
        </div>
      </ExamPageShell>
    );
  }

  if (!exam) {
    return (
      <ExamPageShell isRtl={isRtl}>
        <div className="mx-auto max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
          <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">{t('dashboard.myExams.notFound', isRtl ? 'آزمون یافت نشد.' : 'Exam not found.')}</p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/account?view=my-exams">
              <ArrowLeft className="h-4 w-4" />
              {t('dashboard.myExams.back', isRtl ? 'بازگشت' : 'Back')}
            </Link>
          </Button>
        </div>
      </ExamPageShell>
    );
  }

  if (!started) {
    return (
      <ExamPageShell isRtl={isRtl}>
        <Button asChild variant="ghost" size="sm" className="mb-6 -ms-2 text-muted-foreground">
          <Link href="/account?view=my-exams">
            <ArrowLeft className="h-4 w-4" />
            {t('dashboard.myExams.back', isRtl ? 'بازگشت به امتحانات' : 'Back to exams')}
          </Link>
        </Button>

        <div className="overflow-hidden rounded-3xl border bg-card shadow-xl shadow-primary/5">
          <div className="relative bg-gradient-to-br from-primary/90 via-primary to-primary/80 px-6 py-10 text-primary-foreground sm:px-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
            <div className="relative space-y-4">
              <Badge variant="secondary" className="border-0 bg-white/20 text-primary-foreground hover:bg-white/20">
                <BookOpen className="h-3.5 w-3.5" />
                {exam.courseTitle}
              </Badge>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{exam.title}</h1>
              <p className="max-w-xl text-sm text-primary-foreground/85">
                {t('dashboard.myExams.briefingHint', isRtl ? 'قبل از شروع، قوانین آزمون را بخوانید.' : 'Read the exam rules before you start.')}
              </p>
            </div>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-3 sm:p-8">
            {[
              { icon: Clock, value: exam.durationMinutes, label: t('dashboard.myExams.minutes', isRtl ? 'دقیقه' : 'minutes') },
              { icon: ClipboardList, value: exam.questions.length, label: t('dashboard.myExams.questions', isRtl ? 'سوال' : 'questions') },
              { icon: Trophy, value: exam.totalPoints, label: t('dashboard.myExams.points', isRtl ? 'امتیاز' : 'points') },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-4 rounded-2xl border bg-muted/30 p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t bg-muted/20 px-6 py-6 sm:px-8">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              {t('dashboard.myExams.rulesTitle', isRtl ? 'قوانین آزمون' : 'Exam rules')}
            </h2>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3 rounded-xl border bg-background/80 p-3">
                <Timer className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {t('dashboard.myExams.rules', isRtl ? 'پس از شروع، تایمر بدون مکث اجرا می‌شود. خروج از صفحه آزمون را می‌بندد.' : 'Once started, the timer cannot be paused. Leaving the page will close the exam.')}
              </li>
              <li className="flex gap-3 rounded-xl border bg-background/80 p-3">
                <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {t('dashboard.myExams.rulesAutoSave', isRtl ? 'پاسخ‌ها به‌صورت خودکار ذخیره می‌شوند.' : 'Your answers are saved automatically.')}
              </li>
            </ul>
            <Button
              size="lg"
              className="mt-8 h-12 w-full rounded-xl text-base shadow-lg shadow-primary/20"
              onClick={() => void handleStart()}
              disabled={starting}
            >
              {starting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
              {t('dashboard.myExams.start', isRtl ? 'شروع آزمون' : 'Start exam')}
            </Button>
          </div>
        </div>
      </ExamPageShell>
    );
  }

  return (
    <ExamPageShell isRtl={isRtl}>
      {/* Timer & progress header */}
      <div className="sticky top-2 z-20 mb-6 overflow-hidden rounded-2xl border bg-card/95 shadow-lg backdrop-blur-md">
        <div className="h-1 bg-muted">
          <div
            className={cn('h-full transition-all duration-1000', isUrgent ? 'bg-destructive' : 'bg-primary')}
            style={{ width: `${timerPct}%` }}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{exam.title}</p>
            <p className="text-xs text-muted-foreground">
              {answeredCount}/{totalQuestions}{' '}
              {t('dashboard.myExams.answered', isRtl ? 'پاسخ داده شده' : 'answered')}
            </p>
          </div>
          <div
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-lg font-bold tabular-nums',
              isUrgent ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
            )}
          >
            <Timer className={cn('h-5 w-5', isUrgent && 'animate-pulse')} />
            {formatTime(remainingSec)}
          </div>
        </div>
      </div>

      {/* Question navigator */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {exam.questions.map((q, idx) => {
          const answered = isQuestionAnswered(q, answers);
          const isCurrent = idx === currentIndex;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                'flex h-10 min-w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-medium transition-all',
                isCurrent && 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25',
                !isCurrent && answered && 'border-primary/40 bg-primary/5 text-primary',
                !isCurrent && !answered && 'border-border bg-background text-muted-foreground hover:border-primary/30'
              )}
            >
              {answered && !isCurrent ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
            </button>
          );
        })}
      </div>

      {/* Current question */}
      {currentQuestion ? (
        <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
          <div className="border-b bg-muted/30 px-5 py-4 sm:px-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1">
                {(() => {
                  const meta = QUESTION_TYPE_META[currentQuestion.questionType] ?? QUESTION_TYPE_META[0];
                  const Icon = meta.icon;
                  return (
                    <>
                      <Icon className="h-3.5 w-3.5" />
                      {isRtl ? meta.fa : meta.en}
                    </>
                  );
                })()}
              </Badge>
              <Badge variant="secondary">
                {currentQuestion.points} {t('dashboard.myExams.points', isRtl ? 'نمره' : 'pts')}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {t('dashboard.myExams.questionLabel', isRtl ? 'سوال' : 'Question')} {currentIndex + 1} / {totalQuestions}
              </span>
            </div>
            <h2 className="mt-4 text-lg font-semibold leading-relaxed sm:text-xl">{currentQuestion.prompt}</h2>
          </div>

          <div className="space-y-4 px-5 py-6 sm:px-8">
            {currentQuestion.codeSnippet ? (
              <ExamQuestionCodeBlock
                code={currentQuestion.codeSnippet}
                language={currentQuestion.codeLanguage}
                copyLabel={t('dashboard.common.copy', isRtl ? 'کپی' : 'Copy')}
                copiedLabel={t('dashboard.common.copied', isRtl ? 'کپی شد' : 'Copied')}
              />
            ) : null}

            {currentQuestion.questionType === 2 ? (
              <>
                <ExamAnswerEditor
                  key={currentQuestion.id}
                  value={answers[currentQuestion.id]?.textAnswer ?? ''}
                  onChange={(html) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [currentQuestion.id]: { optionIds: [], textAnswer: html },
                    }))
                  }
                  trackPaste={!exam.allowPaste}
                  onPasteDetected={() => handlePasteDetected(currentQuestion.id)}
                  onUploadImage={uploadCommunityQaImage}
                  onUploadAudio={uploadCommunityQaAudio}
                  placeholder={t('dashboard.myExams.answerPlaceholder', isRtl ? 'پاسخ خود را بنویسید...' : 'Write your answer...')}
                  editorMinHeight="260px"
                  editorMaxHeight="480px"
                  labels={{
                    bold: isRtl ? 'درشت' : 'Bold',
                    italic: isRtl ? 'کج' : 'Italic',
                    underline: isRtl ? 'زیرخط' : 'Underline',
                    bulletList: isRtl ? 'لیست نشانه‌دار' : 'Bullet list',
                    orderedList: isRtl ? 'لیست شماره‌دار' : 'Ordered list',
                    code: isRtl ? 'بلوک کد' : 'Code block',
                    alignLeft: isRtl ? 'چپ‌چین' : 'Align left',
                    alignCenter: isRtl ? 'وسط‌چین' : 'Align center',
                    alignRight: isRtl ? 'راست‌چین' : 'Align right',
                    font: isRtl ? 'فونت' : 'Font',
                    fontSize: isRtl ? 'اندازه' : 'Size',
                    color: isRtl ? 'رنگ متن' : 'Text color',
                    image: isRtl ? 'تصویر' : 'Image',
                    audio: isRtl ? 'فایل صوتی' : 'Audio file',
                    record: isRtl ? 'ضبط صدا' : 'Record audio',
                    paste: isRtl ? 'کپی/چسباندن کنترل می‌شود' : 'Copy/paste is tracked',
                  }}
                />
                {!exam.allowPaste ? (
                  <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                    <ClipboardPaste className="h-3.5 w-3.5" />
                    {t(
                      'dashboard.myExams.pasteHint',
                      isRtl
                        ? 'چسباندن متن مجاز است اما به‌عنوان «کپی‌شده» علامت‌گذاری و به استاد نمایش داده می‌شود.'
                        : 'Pasting is allowed but marked as copied and shown to the teacher.'
                    )}
                  </p>
                ) : null}
              </>
            ) : (
              <div className="grid gap-3">
                {currentQuestion.options.map((o, oi) => {
                  const selected = (answers[currentQuestion.id]?.optionIds ?? []).includes(o.id);
                  const label = isRtl
                    ? `${OPTION_LABELS_FA[oi] ?? oi + 1}`
                    : String.fromCharCode(65 + oi);
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() =>
                        setAnswers((prev) => ({
                          ...prev,
                          [currentQuestion.id]: { optionIds: [o.id], textAnswer: '' },
                        }))
                      }
                      className={cn(
                        'group flex w-full items-start gap-4 rounded-2xl border-2 p-4 text-start transition-all',
                        selected
                          ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10'
                          : 'border-border bg-background hover:border-primary/40 hover:bg-muted/30'
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-colors',
                          selected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                        )}
                      >
                        {label}
                      </span>
                      <span className="pt-1.5 text-sm leading-relaxed sm:text-base">{o.text}</span>
                      {selected ? (
                        <CheckCircle2 className="ms-auto h-5 w-5 shrink-0 text-primary" />
                      ) : (
                        <Circle className="ms-auto h-5 w-5 shrink-0 text-muted-foreground/40" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Bottom navigation */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            >
              {isRtl ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              {t('dashboard.myExams.prev', isRtl ? 'قبلی' : 'Previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={currentIndex >= totalQuestions - 1}
              onClick={() => setCurrentIndex((i) => Math.min(totalQuestions - 1, i + 1))}
            >
              {t('dashboard.myExams.next', isRtl ? 'بعدی' : 'Next')}
              {isRtl ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-xs text-muted-foreground sm:block">
              {progressPct}% {t('dashboard.myExams.complete', isRtl ? 'تکمیل' : 'complete')}
            </div>
            <Button
              className="h-11 flex-1 rounded-xl shadow-lg shadow-primary/15 sm:flex-none sm:px-8"
              onClick={() => void handleSubmit()}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {t('dashboard.myExams.submit', isRtl ? 'تحویل آزمون' : 'Submit exam')}
            </Button>
          </div>
        </div>
      </div>

      <div className="h-24" />
    </ExamPageShell>
  );
}
