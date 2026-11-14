'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Check, MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/components/language-provider';
import { CustomRichTextEditor } from '@/components/ui/custom-rich-text-editor';
import {
  getProjectQuestionById,
  reviewProjectQuestion,
  submitProjectAnswer,
  type ProjectQuestionDetail,
} from '@/services/project-question-api.service';
import { resolveMediaUrl, resolveRichTextHtml } from '@/lib/resolve-rich-text-html';
import { useProjectQaHub } from '@/hooks/use-project-qa-hub';

export default function ProjectQuestionDetailPage() {
  const params = useParams();
  const questionId = Number(params.id);
  const { t } = useLanguage();
  const { toast } = useToast();
  const [question, setQuestion] = React.useState<ProjectQuestionDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [answerHtml, setAnswerHtml] = React.useState('');

  const load = React.useCallback(async () => {
    if (!Number.isFinite(questionId) || questionId <= 0) return;
    setLoading(true);
    try {
      setQuestion(await getProjectQuestionById(questionId));
    } catch {
      setQuestion(null);
    } finally {
      setLoading(false);
    }
  }, [questionId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  useProjectQaHub({
    isAdmin: true,
    handlers: {
      onQuestionSubmitted: (payload) => {
        if (payload.questionId === questionId) {
          void load();
        }
      },
    },
  });

  const handleReview = async (approve: boolean) => {
    if (!question) return;
    setSubmitting(true);
    try {
      await reviewProjectQuestion(question.id, approve);
      toast({
        title: approve ? t('project_questions_approved_toast') : t('project_questions_rejected_toast'),
      });
      await load();
    } catch (e) {
      toast({
        variant: 'destructive',
        title: t('project_questions_review_error'),
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswer = async () => {
    if (!question || !answerHtml.trim()) return;
    setSubmitting(true);
    try {
      await submitProjectAnswer({ questionId: question.id, contentHtml: answerHtml });
      toast({ title: t('project_questions_answer_posted') });
      setAnswerHtml('');
      await load();
    } catch (e) {
      toast({
        variant: 'destructive',
        title: t('project_questions_answer_error'),
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/project-questions">
            <ArrowLeft className="h-4 w-4 me-2" />
            {t('project_questions_back')}
          </Link>
        </Button>
        <p className="text-muted-foreground">{t('project_questions_not_found')}</p>
      </div>
    );
  }

  const canReview = question.status === 'Pending';
  const canAnswer = question.status === 'Approved';
  const questionHtml = resolveRichTextHtml(question.contentHtml);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/project-questions"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t('project_questions_detail_title')}</h1>
            <p className="text-sm text-muted-foreground">{question.projectTitle}</p>
          </div>
        </div>
        <Badge variant={question.status === 'Approved' ? 'default' : question.status === 'Rejected' ? 'destructive' : 'secondary'}>
          {question.status}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{question.subject || t('project_questions_col_subject')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="prose prose-sm dark:prose-invert max-w-none [&_img]:my-3 [&_img]:max-h-[480px] [&_img]:w-auto [&_img]:rounded-lg [&_img]:border"
              dangerouslySetInnerHTML={{ __html: questionHtml }}
            />
            {question.audioUrl && (
              <audio controls className="w-full max-w-md" src={resolveMediaUrl(question.audioUrl)} />
            )}
            {question.answers.length > 0 && (
              <div className="space-y-3 border-t pt-4">
                <h3 className="font-semibold">{t('project_questions_answers_section')}</h3>
                {question.answers.map((a) => (
                  <div key={a.id} className="rounded-lg border p-3">
                    <p className="text-sm font-medium">{a.authorName} · {a.createdAt}</p>
                    <div
                      className="prose prose-sm dark:prose-invert mt-2 max-w-none [&_img]:my-2 [&_img]:max-h-[360px] [&_img]:w-auto [&_img]:rounded-lg"
                      dangerouslySetInnerHTML={{ __html: resolveRichTextHtml(a.contentHtml) }}
                    />
                    {a.audioUrl && (
                      <audio controls className="mt-2 w-full max-w-md" src={resolveMediaUrl(a.audioUrl)} />
                    )}
                    <p className="text-xs text-muted-foreground mt-2">{a.likeCount} likes</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>{t('project_questions_requester')}</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-1">
              <p>{question.authorName || '—'}</p>
              <p className="text-muted-foreground">{question.authorEmail || '—'}</p>
              <p className="text-muted-foreground">{question.createdAt}</p>
            </CardContent>
          </Card>

          {canReview && (
            <Card>
              <CardHeader><CardTitle>{t('project_questions_moderation')}</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Button onClick={() => void handleReview(true)} disabled={submitting}>
                  <Check className="h-4 w-4 me-2" />{t('project_questions_approve')}
                </Button>
                <Button variant="destructive" onClick={() => void handleReview(false)} disabled={submitting}>
                  <X className="h-4 w-4 me-2" />{t('project_questions_reject')}
                </Button>
              </CardContent>
            </Card>
          )}

          {canAnswer && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  {t('project_questions_admin_answer')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <CustomRichTextEditor content={answerHtml} onChangeAction={setAnswerHtml} />
                <Button onClick={() => void handleAnswer()} disabled={submitting || !answerHtml.trim()}>
                  {t('project_questions_post_answer')}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
