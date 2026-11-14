import createDOMPurify from 'dompurify';

const RICH_HTML_ATTR = [
  'style',
  'class',
  'dir',
  'colspan',
  'rowspan',
  'data-lucide-icon',
  'data-language',
];

export function sanitizeRichHtml(html: string): string {
  if (!html) return '';
  if (typeof window === 'undefined') return html;

  const DOMPurify = createDOMPurify(window);
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_TAGS: ['table', 'thead', 'tbody', 'tr', 'th', 'td', 'colgroup', 'col', 'caption', 'span'],
    ADD_ATTR: RICH_HTML_ATTR,
    ALLOW_DATA_ATTR: true,
  });
}
