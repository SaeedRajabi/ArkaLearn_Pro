'use client';

import { useCallback, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { sanitizeQaHtml } from '@/lib/qa-content-html';
import { cn } from '@/lib/utils';
import styles from './qa-content-html.module.css';

type QaContentHtmlProps = {
  html: string;
  resolveMediaUrl: (url: string) => string;
  className?: string;
};

export function QaContentHtml({ html, resolveMediaUrl, className }: QaContentHtmlProps) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;
      if (target.tagName !== 'IMG') return;
      const img = target as HTMLImageElement;
      const full =
        img.getAttribute('data-qa-full-src') ||
        img.getAttribute('src') ||
        '';
      if (full) setLightboxSrc(full);
    },
    []
  );

  if (!html?.trim()) return null;

  const safeHtml = sanitizeQaHtml(html, resolveMediaUrl);

  return (
    <>
      <div
        className={cn(styles.qaContent, 'prose prose-sm dark:prose-invert max-w-none', className)}
        dangerouslySetInnerHTML={{ __html: safeHtml }}
        onClick={handleClick}
      />
      <Dialog open={Boolean(lightboxSrc)} onOpenChange={(open) => !open && setLightboxSrc(null)}>
        <DialogContent className="max-w-[min(96vw,1200px)] border-none bg-transparent p-2 shadow-none">
          <DialogTitle className="sr-only">Image preview</DialogTitle>
          {lightboxSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lightboxSrc}
              alt=""
              className="mx-auto max-h-[85vh] w-auto max-w-full rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
