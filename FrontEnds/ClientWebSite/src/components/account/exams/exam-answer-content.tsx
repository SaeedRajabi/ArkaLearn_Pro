'use client';

import * as React from 'react';
import hljs from 'highlight.js/lib/common';
import { QaContentHtml } from '@/components/shared/qa-content-html';
import { resolveQaMediaUrl } from '@/lib/qa-content-html';
import { cn } from '@/lib/utils';
import styles from './exam-answer-content.module.css';

type ExamAnswerContentProps = {
  html?: string | null;
  emptyLabel?: string;
  className?: string;
};

function resolveMediaUrl(url?: string | null): string {
  if (!url) return '';
  return resolveQaMediaUrl(url);
}

/**
 * TipTap stores code blocks as plain text, so syntax highlighting is applied at
 * render time: every `pre code` is highlighted with highlight.js (language taken
 * from the `language-*` class, auto-detected otherwise).
 */
function highlightCodeBlocks(html: string): string {
  if (typeof window === 'undefined' || !html.includes('<code')) return html;
  try {
    const container = new DOMParser().parseFromString(html, 'text/html');
    container.querySelectorAll('pre code').forEach((code) => {
      const text = code.textContent ?? '';
      if (!text.trim()) return;
      const langClass = [...code.classList].find((c) => c.startsWith('language-'));
      const lang = langClass?.slice('language-'.length);
      try {
        code.innerHTML =
          lang && hljs.getLanguage(lang)
            ? hljs.highlight(text, { language: lang }).value
            : hljs.highlightAuto(text).value;
        code.classList.add('hljs');
      } catch {
        /* leave the block as plain text */
      }
    });
    return container.body.innerHTML;
  } catch {
    return html;
  }
}

/**
 * Renders an exam answer exactly as it was written in the editor (formatted text,
 * images, audio, code) and highlights pasted content for the teacher.
 */
export function ExamAnswerContent({ html, emptyLabel = '—', className }: ExamAnswerContentProps) {
  const highlighted = React.useMemo(() => (html ? highlightCodeBlocks(html) : ''), [html]);

  if (!highlighted.trim()) {
    return <p className={cn('text-sm text-muted-foreground', className)}>{emptyLabel}</p>;
  }

  return (
    <QaContentHtml
      html={highlighted}
      resolveMediaUrl={resolveMediaUrl}
      className={cn(styles.answerContent, 'rounded-lg border bg-muted/30 p-3', className)}
    />
  );
}

/** Visible text of an answer (HTML stripped) — used for "answered" checks. */
export function examAnswerToPlainText(html?: string | null): string {
  if (!html) return '';
  if (typeof window === 'undefined') return html.replace(/<[^>]*>/g, ' ');
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.textContent ?? '').trim();
}

/** True when the answer has visible text or embedded media (image/audio/video). */
export function hasExamAnswerContent(html?: string | null): boolean {
  if (!html) return false;
  if (/<(img|audio|video)\b/i.test(html)) return true;
  return examAnswerToPlainText(html).length > 0;
}
