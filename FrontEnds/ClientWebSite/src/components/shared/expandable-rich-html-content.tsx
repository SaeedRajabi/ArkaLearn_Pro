'use client';

import * as React from 'react';
import { RichHtmlContent } from '@/components/shared/rich-html-content';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const COLLAPSED_MAX_HEIGHT = 320;

interface ExpandableRichHtmlContentProps {
  html: string;
  dir?: 'rtl' | 'ltr';
  className?: string;
  readMoreLabel: string;
  readLessLabel: string;
}

export function ExpandableRichHtmlContent({
  html,
  dir,
  className,
  readMoreLabel,
  readLessLabel,
}: ExpandableRichHtmlContentProps) {
  const [expanded, setExpanded] = React.useState(false);
  const [needsExpand, setNeedsExpand] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const measure = () => {
      setNeedsExpand(el.scrollHeight > COLLAPSED_MAX_HEIGHT + 8);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [html]);

  if (!html.trim()) return null;

  return (
    <div>
      <div
        ref={contentRef}
        className={cn(
          'relative overflow-hidden transition-[max-height] duration-300 ease-in-out',
          !expanded && needsExpand && 'max-h-80'
        )}
        style={!expanded && needsExpand ? { maxHeight: COLLAPSED_MAX_HEIGHT } : undefined}
      >
        <RichHtmlContent html={html} dir={dir} className={className} />
        {!expanded && needsExpand && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
        )}
      </div>
      {needsExpand && (
        <Button
          type="button"
          variant="link"
          className="mt-3 h-auto px-0 text-primary"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? readLessLabel : readMoreLabel}
        </Button>
      )}
    </div>
  );
}
