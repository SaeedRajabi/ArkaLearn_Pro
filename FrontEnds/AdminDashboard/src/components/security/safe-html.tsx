'use client';

import DOMPurify from 'dompurify';

type SafeHtmlProps = {
  html?: string | null;
  className?: string;
  dir?: 'auto' | 'ltr' | 'rtl';
};

const ALLOWED_TAGS = [
  'a',
  'blockquote',
  'br',
  'code',
  'div',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'img',
  'li',
  'ol',
  'p',
  'pre',
  'span',
  'strong',
  'u',
  'ul',
];

const ALLOWED_ATTR = [
  'alt',
  'class',
  'href',
  'rel',
  'src',
  'target',
  'title',
  'data-lucide-icon',
];

export function SafeHtml({ html, className, dir }: SafeHtmlProps) {
  const sanitized = DOMPurify.sanitize(html ?? '', {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|\/(?!\/)|data:image\/(?:png|gif|jpeg|webp);base64,)/i,
  });

  return <div dir={dir} className={className} dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
