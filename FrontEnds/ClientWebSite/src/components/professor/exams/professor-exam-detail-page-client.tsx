'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, ClipboardPaste, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ExamQuestionCodeBlock } from '@/components/shared/exam-question-code-block';
import { ExamAnswerContent } from '@/components/account/exams/exam-answer-content';
import {
  getProfessorExamById,
  getExamAttemptForGrading,
  gradeExamAttempt,
  type ExamDetail,
  type ExamAttemptGrading,
} from '@/lib/api/professor-exams';
import { getDictValue } from '@/lib/i18n-client';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/hooks/use-toast';
import type { Dictionary } from '@/types';

const ATTEMPT_STATUS: Record<number, { fa: string; en: string }> = {
  0: { fa: 'در انتظار', en: 'Pending' },
  1: { fa: 'در حال انجام', en: 'In progress' },
  2: { fa: 'تحویل شده', en: 'Submitted' },
  3: { fa: 'رها شده', en: 'Abandoned' },
  4: { fa: 'تصحیح شده', en: 'Graded' },
};

type Props = { dict: Dictionary; examId: number };

export function ProfessorExamDetailPageClient({ dict, examId }: Props) {
  const searchParams = useSearchParams();
  const attemptParam = searchParams.get('attempt');
  const { locale } = useLanguage();
  const isRtl = locale === 'fa';
  const { toast } = useToast();
  const t = (key: string, fb: string) => getDictValue(dict, key, fb);

  const [exam, setExam] = React.useState<ExamDetail | null>(null);
  const [grading, setGrading] = React.useState<ExamAttemptGrading | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [finalScore, setFinalScore] = React.useState('');
  const [feedback, setFeedback] = React.useState('');
  const [shortGrades, setShortGrades] = React.useState<Record<number, string>>({});
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const detail = await getProfessorExamById(examId);
      setExam(detail);
      const attemptId = attemptParam ? Number(attemptParam) : detail.attempts.find((a) => a.status === 2 || a.status === 3)?.attemptId;
      if (attemptId) {
        const g = await getExamAttemptForGrading(attemptId);
        setGrading(g);
        setFinalScore(String(g.finalScore ?? g.autoScore ?? ''));
        setFeedback(g.professorFeedback ?? '');
        const grades: Record<number, string> = {};
        g.questions.filter((q) => q.questionType === 2).forEach((q) => {
          grades[q.questionId] = String(q.pointsAwarded ?? '');
        });
        setShortGrades(grades);
      } else {
        setGrading(null);
      }
    } catch {
      setExam(null);
    } finally {
      setLoading(false);
    }
  }, [examId, attemptParam]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const openGrading = async (attemptId: number) => {
    const g = await getExamAttemptForGrading(attemptId);
    setGrading(g);
    setFinalScore(String(g.finalScore ?? g.autoScore ?? ''));
    setFeedback(g.professorFeedback ?? '');
    const grades: Record<number, string> = {};
    g.questions.filter((q) => q.questionType === 2).forEach((q) => {
      grades[q.questionId] = String(q.pointsAwarded ?? '');
    });
    setShortGrades(grades);
    window.history.replaceState(null, '', `/professor/exams/${examId}?attempt=${attemptId}`);
  };

  const handleGrade = async () => {
    if (!grading) return;
    setSaving(true);
    try {
      await gradeExamAttempt({
        attemptId: grading.attemptId,
        finalScore: Number(finalScore) || 0,
        professorFeedback: feedback.trim() || undefined,
        questionGrades: grading.questions
          .filter((q) => q.questionType === 2)
          .map((q) => ({
            questionId: q.questionId,
            pointsAwarded: Number(shortGrades[q.questionId]) || 0,
          })),
      });
      toast({ title: t('professorDashboard.exams.graded', isRtl ? 'نمره ثبت شد.' : 'Grade saved.') });
      await load();
    } catch (e) {
      toast({ variant: 'destructive', title: e instanceof Error ? e.message : 'Error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!exam) {
    return <p className="text-muted-foreground">{t('professorDashboard.exams.notFound', isRtl ? 'امتحان یافت نشد.' : 'Exam not found.')}</p>;
  }

  const statusText = (s: number) => {
    const item = ATTEMPT_STATUS[s] ?? ATTEMPT_STATUS[0];
    return isRtl ? item.fa : item.en;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/professor/exams"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{exam.title}</h1>
          <p className="text-sm text-muted-foreground">{exam.courseTitle} · {exam.totalPoints} {t('professorDashboard.exams.points', isRtl ? 'امتیاز' : 'pts')}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('professorDashboard.exams.participants', isRtl ? 'شرکت‌کنندگان' : 'Participants')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {exam.attempts.map((a) => (
            <div key={a.attemptId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm">
              <div>
                <p className="font-medium">{a.studentName}</p>
                <Badge variant="outline">{statusText(a.status)}</Badge>
                {a.finalScore != null ? <span className="ms-2 text-muted-foreground">{a.finalScore}</span> : null}
              </div>
              {(a.status === 2 || a.status === 3 || a.status === 4) ? (
                <Button size="sm" variant="outline" onClick={() => void openGrading(a.attemptId)}>
                  {t('professorDashboard.exams.grade', isRtl ? 'مشاهده / تصحیح' : 'View / grade')}
                </Button>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>

      {grading ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              {grading.studentName} — {t('professorDashboard.exams.grading', isRtl ? 'تصحیح' : 'Grading')}
              {!grading.allowPaste ? (
                <Badge variant="outline" className="gap-1 border-amber-500/40 text-amber-600 dark:text-amber-400">
                  <ClipboardPaste className="h-3 w-3" />
                  {t('professorDashboard.exams.pasteTrackedExam', isRtl ? 'کپی/چسباندن کنترل شده' : 'Copy/paste tracked')}
                </Badge>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {grading.questions.some((q) => (q.pasteCount ?? 0) > 0) ? (
              <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                {t(
                  'professorDashboard.exams.pasteLegend',
                  isRtl
                    ? 'بخش‌هایی از پاسخ که دانشجو کپی/چسبانده با پس‌زمینه زرد و متن قرمز مشخص شده‌اند.'
                    : 'Parts the student pasted are highlighted with a yellow background and red text.'
                )}
              </p>
            ) : null}
            {grading.questions.map((q, idx) => (
              <div key={q.questionId} className="rounded-lg border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">#{idx + 1} {q.prompt}</p>
                  <Badge variant="secondary" className="shrink-0 gap-1">
                    <Award className="h-3 w-3" />
                    {t('professorDashboard.exams.scoreOf', isRtl ? 'نمره' : 'Score')}:
                    {q.pointsAwarded != null ? ` ${q.pointsAwarded} / ${q.points}` : ` ${q.points}`}
                  </Badge>
                </div>
                {q.codeSnippet ? (
                  <div className="mt-2">
                    <ExamQuestionCodeBlock code={q.codeSnippet} language={q.codeLanguage} />
                  </div>
                ) : null}
                {q.questionType === 2 ? (
                  <div className="mt-2 space-y-2">
                    {(q.pasteCount ?? 0) > 0 ? (
                      <Badge variant="outline" className="gap-1 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                        <ClipboardPaste className="h-3 w-3" />
                        {q.pasteCount} ×{' '}
                        {t('professorDashboard.exams.pasteCountLabel', isRtl ? 'چسباندن' : 'paste')}
                      </Badge>
                    ) : null}
                    <ExamAnswerContent html={q.textAnswer} />
                    <div className="flex items-center gap-2">
                      <Label>{t('professorDashboard.exams.awarded', isRtl ? 'امتیاز داده‌شده' : 'Awarded')}</Label>
                      <Input
                        type="number"
                        className="w-24"
                        value={shortGrades[q.questionId] ?? ''}
                        onChange={(e) => setShortGrades((prev) => ({ ...prev, [q.questionId]: e.target.value }))}
                      />
                      <span className="text-xs text-muted-foreground">/ {q.points}</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 space-y-1">
                    {q.options.map((o) => {
                      const selected = (() => {
                        try {
                          return (JSON.parse(q.selectedOptionIdsJson || '[]') as number[]).includes(o.id ?? 0);
                        } catch {
                          return false;
                        }
                      })();
                      return (
                        <p key={o.id} className={selected ? (o.isCorrect ? 'text-green-600' : 'text-destructive') : 'text-muted-foreground'}>
                          {o.text} {o.isCorrect ? '✓' : ''} {selected ? '←' : ''}
                        </p>
                      );
                    })}
                    {q.pointsAwarded != null ? (
                      <p className="text-xs text-muted-foreground">{t('professorDashboard.exams.autoScore', isRtl ? 'خودکار' : 'Auto')}: {q.pointsAwarded}</p>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('professorDashboard.exams.finalScore', isRtl ? 'نمره نهایی' : 'Final score')}</Label>
                <Input value={finalScore} onChange={(e) => setFinalScore(e.target.value)} />
                {grading.autoScore != null ? (
                  <p className="text-xs text-muted-foreground">{t('professorDashboard.exams.autoTotal', isRtl ? 'خودکار' : 'Auto')}: {grading.autoScore}</p>
                ) : null}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t('professorDashboard.exams.feedback', isRtl ? 'بازخورد' : 'Feedback')}</Label>
                <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3} />
              </div>
            </div>
            {grading.status !== 4 ? (
              <Button onClick={() => void handleGrade()} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {t('professorDashboard.exams.saveGrade', isRtl ? 'ثبت نمره' : 'Save grade')}
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
