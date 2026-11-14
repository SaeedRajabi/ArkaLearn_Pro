'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Award,
  ChevronDown,
  ChevronUp,
  MessageCircleQuestion,
  Send,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { getDictValue } from '@/lib/i18n-client';
import { getBackendApiOrigin } from '@/lib/api/config';
import { getApiErrorMessage } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import type { Dictionary } from '@/types';
import { QaRichTextEditor } from '@/components/ui/qa-rich-text-editor';
import {
  getProjectQuestions,
  submitProjectQuestion,
  uploadProjectQuestionAudio,
  uploadProjectQuestionImage,
  type ProjectQuestionItem,
} from '@/lib/api/project-questions';
import { useProjectQaHub, scrollToQaQuestion } from '@/hooks/use-project-qa-hub';
import { playNotificationSound } from '@/lib/notification-sound';
import { QaContentHtml } from '@/components/shared/qa-content-html';

function resolveMediaUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${getBackendApiOrigin()}${url.startsWith('/') ? url : `/${url}`}`;
}

function initials(name?: string | null) {
  const p = (name ?? '?').trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] ?? '?') + (p[1]?.[0] ?? '')).toUpperCase();
}

interface ProjectQaSectionProps {
  projectId: number;
  dict: Dictionary;
  lang: 'en' | 'fa';
}

export function ProjectQaSection({ projectId, dict, lang }: ProjectQaSectionProps) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const isRtl = lang === 'fa';
  const t = (key: string, def: string) => getDictValue(dict, key, def);

  const [questions, setQuestions] = useState<ProjectQuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [askOpen, setAskOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [questionHtml, setQuestionHtml] = useState('');
  const [submittingQ, setSubmittingQ] = useState(false);
  const pendingScrollQuestionId = useRef<number | null>(null);

  const loginHref = `/login?returnUrl=${encodeURIComponent(pathname || '/projects')}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProjectQuestions(projectId);
      setQuestions(data);
    } catch {
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const scrollToQuestion = useCallback((questionId: number, highlight = true) => {
    pendingScrollQuestionId.current = questionId;
    if (!scrollToQaQuestion(questionId, highlight)) {
      return;
    }
    pendingScrollQuestionId.current = null;
  }, []);

  useProjectQaHub({
    projectId,
    userId: user?.id,
    handlers: {
      onAnswerPosted: (payload) => {
        if (payload.projectId !== projectId) return;
        playNotificationSound();
        void load().then(() => scrollToQuestion(payload.questionId));
      },
      onQuestionReviewed: (payload) => {
        if (payload.projectId !== projectId || !payload.approved) return;
        void load().then(() => scrollToQuestion(payload.questionId, false));
      },
    },
  });

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (loading) return;

    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (hash.startsWith('#qa-')) {
      const questionId = Number(hash.slice(4));
      if (Number.isFinite(questionId) && questionId > 0) {
        scrollToQuestion(questionId);
      }
    } else if (pendingScrollQuestionId.current) {
      scrollToQuestion(pendingScrollQuestionId.current);
    }
  }, [loading, questions, scrollToQuestion]);

  const totalAnswers = useMemo(
    () => questions.reduce((sum, q) => sum + q.answers.length, 0),
    [questions]
  );

  const handleAsk = async () => {
    if (!user) {
      router.push(loginHref);
      return;
    }
    setSubmittingQ(true);
    try {
      await submitProjectQuestion({
        projectId,
        subject: subject.trim() || undefined,
        contentHtml: questionHtml,
      });
      toast({
        title: t('projectQa.questionSubmitted', 'Question submitted'),
        description: t('projectQa.pendingReview', 'It will appear after admin approval.'),
      });
      setSubject('');
      setQuestionHtml('');
      setAskOpen(false);
    } catch (e) {
      toast({
        variant: 'destructive',
        title: getApiErrorMessage(e, t('projectQa.submitError', 'Could not submit question.')),
      });
    } finally {
      setSubmittingQ(false);
    }
  };

  return (
    <section id="project-qa" className="rounded-xl border bg-background p-6 shadow-sm sm:p-8" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MessageCircleQuestion className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-headline text-2xl font-bold">{t('projectQa.title', 'Questions & Answers')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('projectQa.subtitle', 'Ask about this project. Only administrators respond to questions.')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary">{questions.length} {t('projectQa.questions', 'questions')}</Badge>
          <Badge variant="outline">{totalAnswers} {t('projectQa.answers', 'answers')}</Badge>
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-dashed bg-muted/20 p-4">
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between"
          onClick={() => setAskOpen((v) => !v)}
        >
          <span>{t('projectQa.askQuestion', 'Ask a question')}</span>
          {askOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        {askOpen && (
          <div className="mt-4 space-y-4">
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t('projectQa.subjectPlaceholder', 'Short subject (optional)')}
            />
            <QaRichTextEditor
              value={questionHtml}
              onChange={setQuestionHtml}
              onUploadImage={uploadProjectQuestionImage}
              onUploadAudio={uploadProjectQuestionAudio}
              placeholder={t('projectQa.questionPlaceholder', 'Describe your question with text, images, or voice...')}
            />
            <Button onClick={() => void handleAsk()} disabled={submittingQ}>
              <Send className="h-4 w-4 me-2" />
              {submittingQ ? t('projectQa.submitting', 'Submitting...') : t('projectQa.submitQuestion', 'Submit question')}
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : questions.length === 0 ? (
        <p className="rounded-lg border bg-muted/30 px-4 py-8 text-center text-muted-foreground">
          {t('projectQa.empty', 'No questions yet. Be the first to ask!')}
        </p>
      ) : (
        <div className="space-y-6">
          {questions.map((q) => (
            <article key={q.id} id={`qa-${q.id}`} className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex gap-3">
                <Avatar className="h-10 w-10 shrink-0">
                  {q.authorAvatarUrl && <AvatarImage src={resolveMediaUrl(q.authorAvatarUrl)} alt="" />}
                  <AvatarFallback>{initials(q.authorName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{q.authorName || t('projectQa.anonymous', 'User')}</p>
                    <span className="text-xs text-muted-foreground">{q.createdAt}</span>
                  </div>
                  {q.subject && <h3 className="mt-1 text-lg font-medium">{q.subject}</h3>}
                  <QaContentHtml
                    html={q.contentHtml}
                    resolveMediaUrl={resolveMediaUrl}
                    className="mt-2"
                  />
                  {q.audioUrl && (
                    <audio controls className="mt-3 w-full max-w-md" src={resolveMediaUrl(q.audioUrl)} />
                  )}
                </div>
              </div>

              {q.answers.length > 0 && (
                <div className="mt-5 space-y-3 border-t pt-4 ps-2 sm:ps-8">
                  <p className="text-sm font-semibold text-muted-foreground">
                    {t('projectQa.adminAnswers', 'Administrator answers')}
                  </p>
                  {q.answers.map((a) => (
                    <div
                      key={a.id}
                      className={cn(
                        'rounded-lg border p-4',
                        a.isBestAnswer && 'border-amber-400/60 bg-amber-50/50 dark:bg-amber-950/20'
                      )}
                    >
                      <div className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          {a.authorAvatarUrl && <AvatarImage src={resolveMediaUrl(a.authorAvatarUrl)} alt="" />}
                          <AvatarFallback className="text-xs">{initials(a.authorName)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium">{a.authorName}</span>
                            {a.isBestAnswer && (
                              <Badge className="gap-1 bg-amber-500 hover:bg-amber-500">
                                <Award className="h-3 w-3" />
                                {t('projectQa.bestAnswer', 'Best answer')}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">{a.createdAt}</span>
                          </div>
                          <QaContentHtml
                            html={a.contentHtml}
                            resolveMediaUrl={resolveMediaUrl}
                            className="mt-2"
                          />
                          {a.audioUrl && (
                            <audio controls className="mt-2 w-full max-w-md" src={resolveMediaUrl(a.audioUrl)} />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {q.answers.length === 0 && (
                <p className="mt-4 border-t pt-4 text-sm text-muted-foreground ps-2 sm:ps-8">
                  {t('projectQa.awaitingAdminAnswer', 'Awaiting an answer from the administrator.')}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
