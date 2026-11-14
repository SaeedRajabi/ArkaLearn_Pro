'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const RATING_OPTIONS = [
  { level: 1, emoji: '😠', points: 10 },
  { level: 2, emoji: '😕', points: 20 },
  { level: 3, emoji: '😐', points: 30 },
  { level: 4, emoji: '🙂', points: 40 },
  { level: 5, emoji: '😄', points: 50 },
] as const;

type SupportRatingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: { ratingLevel: number; feedback?: string }) => Promise<void>;
  title: string;
  description: string;
  submitLabel: string;
  feedbackLabel: string;
  feedbackPlaceholder: string;
  ratingRequiredMessage?: string;
};

export function SupportRatingDialog({
  open,
  onOpenChange,
  onSubmit,
  title,
  description,
  submitLabel,
  feedbackLabel,
  feedbackPlaceholder,
  ratingRequiredMessage,
}: SupportRatingDialogProps) {
  const [level, setLevel] = React.useState<number>(0);
  const [feedback, setFeedback] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [ratingError, setRatingError] = React.useState('');

  React.useEffect(() => {
    if (!open) {
      setLevel(0);
      setFeedback('');
    }
  }, [open]);

  const handleSubmit = async () => {
    if (level <= 0) {
      if (ratingRequiredMessage) setRatingError(ratingRequiredMessage);
      return;
    }
    setRatingError('');
    setSubmitting(true);
    try {
      await onSubmit({ ratingLevel: level, feedback: feedback.trim() || undefined });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap justify-center gap-2 py-2">
          {RATING_OPTIONS.map((option) => (
            <button
              key={option.level}
              type="button"
              onClick={() => setLevel(option.level)}
              className={`flex h-16 w-16 flex-col items-center justify-center rounded-xl border text-2xl transition ${
                level === option.level ? 'border-primary bg-primary/10 ring-2 ring-primary' : 'hover:bg-muted/50'
              }`}
              title={String(option.points)}
            >
              <span>{option.emoji}</span>
            </button>
          ))}
        </div>
        {ratingError ? <p className="text-center text-sm text-destructive">{ratingError}</p> : null}
        <div className="space-y-2">
          <Label>{feedbackLabel}</Label>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value.slice(0, 500))}
            placeholder={feedbackPlaceholder}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">{feedback.length}/500</p>
        </div>
        <DialogFooter>
          <Button disabled={submitting || level <= 0} onClick={() => void handleSubmit()}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
