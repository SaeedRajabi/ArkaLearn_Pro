'use client';

import { useMemo } from 'react';
import { sanitizeRichHtml } from '@/lib/sanitize-rich-html';
import { highlightRichHtml } from '@/lib/highlight-setup';
import { cn } from '@/lib/utils';
import '@/styles/rich-html-content.css';

interface RichHtmlContentProps {
  html?: string | null;
  dir?: 'ltr' | 'rtl';
  className?: string;
}

export function RichHtmlContent({ html, dir, className }: RichHtmlContentProps) {
  const safeHtml = useMemo(() => {
    const sanitized = sanitizeRichHtml(html ?? '');
    return highlightRichHtml(sanitized);
  }, [html]);

  if (!safeHtml) return null;

  return (
    <div
      dir={dir}
      className={cn(
        'rich-html-content prose prose-neutral dark:prose-invert max-w-none overflow-x-auto break-words',
        'prose-headings:font-bold prose-headings:break-words prose-p:leading-relaxed prose-p:text-muted-foreground',
        'prose-img:max-w-full prose-img:h-auto prose-img:rounded-xl prose-img:shadow-lg',
        className
      )}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
