'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { generateSummaryAction } from '@/app/dashboard/summary/actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { BotMessageSquare, ListTodo, Milestone, Smile, FileDown } from 'lucide-react';
import { generateWordDocument } from '@/lib/export-to-word';
import type { GenerateMeetingSummaryOutput } from '@/ai/flows/generate-meeting-summary';
import { useLanguage } from "../language-provider";

const initialState = {
  summary: null,
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  const { t } = useLanguage();

  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? t('generatingButton') : t('generateButton')}
    </Button>
  );
}

export function SummaryGenerator({ initialData }: { initialData: GenerateMeetingSummaryOutput | null }) {
  const [state, formAction] = useActionState(generateSummaryAction, {
    ...initialState,
    summary: initialData,
  });
  const [meetingContent, setMeetingContent] = useState('');
  const { t } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    if (state.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: state.error,
      });
    }
  }, [state.error, toast]);

  useEffect(() => {
    if(initialData) {
      setMeetingContent('Summary generated from video recording.');
    }
  }, [initialData]);

  const handleExport = () => {
    if (state.summary) {
      generateWordDocument(state.summary as GenerateMeetingSummaryOutput);
    }
  };

  return (
    <div>
      <form action={formAction} className="space-y-4">
        <Textarea
          name="meetingContent"
          rows={10}
          placeholder={t('transcriptPlaceholder')}
          className="resize-y"
          required
          value={meetingContent}
          onChange={(e) => setMeetingContent(e.target.value)}
          readOnly={!!initialData}
        />
        <div className="flex items-center gap-2">
          <SubmitButton />
          {state.summary && (
            <Button
              type="button"
              variant="outline"
              onClick={handleExport}
              className="w-full sm:w-auto"
            >
              <FileDown className="mr-2 h-4 w-4" />
              Export to Word
            </Button>
          )}
        </div>
      </form>

      {state.summary && (
        <div className="mt-8 grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline">
                <BotMessageSquare className="h-6 w-6 text-primary" />
                {t('summaryResultTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none text-foreground">
              <p>{state.summary.summary}</p>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline">
                  <ListTodo className="h-6 w-6 text-accent" />
                  {t('topicsResultTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-2 pl-5 text-sm text-foreground">
                  {state.summary.importantTopics.map((topic, i) => (
                    <li key={i}>{topic}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline">
                  <Milestone className="h-6 w-6 text-accent" />
                  {t('decisionsResultTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-2 pl-5 text-sm text-foreground">
                  {state.summary.keyDecisions.map((decision, i) => (
                    <li key={i}>{decision}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
             <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline">
                    <Smile className="h-6 w-6 text-primary" />
                    {t('toneResultTitle')}
                </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-medium text-foreground">{state.summary.overallTone}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
