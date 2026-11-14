import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import csharp from 'highlight.js/lib/languages/csharp';
import css from 'highlight.js/lib/languages/css';
import go from 'highlight.js/lib/languages/go';
import java from 'highlight.js/lib/languages/java';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import php from 'highlight.js/lib/languages/php';
import python from 'highlight.js/lib/languages/python';
import rust from 'highlight.js/lib/languages/rust';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';

let registered = false;

const LANGUAGE_ALIASES: Record<string, string> = {
  cs: 'csharp',
  'c#': 'csharp',
  js: 'javascript',
  ts: 'typescript',
  html: 'xml',
  shell: 'bash',
  sh: 'bash',
  plaintext: 'plaintext',
  text: 'plaintext',
};

export function registerHighlightLanguages() {
  if (registered) return;
  hljs.registerLanguage('javascript', javascript);
  hljs.registerLanguage('typescript', typescript);
  hljs.registerLanguage('python', python);
  hljs.registerLanguage('csharp', csharp);
  hljs.registerLanguage('java', java);
  hljs.registerLanguage('html', xml);
  hljs.registerLanguage('xml', xml);
  hljs.registerLanguage('css', css);
  hljs.registerLanguage('sql', sql);
  hljs.registerLanguage('bash', bash);
  hljs.registerLanguage('json', json);
  hljs.registerLanguage('php', php);
  hljs.registerLanguage('go', go);
  hljs.registerLanguage('rust', rust);
  registered = true;
}

function normalizeLanguage(lang: string | null | undefined): string {
  if (!lang) return 'plaintext';
  const key = lang.trim().toLowerCase();
  return LANGUAGE_ALIASES[key] ?? key;
}

function resolveLanguage(element: HTMLElement): string {
  const fromClass = element.className.match(/language-([\w#+-]+)/i)?.[1];
  if (fromClass) return normalizeLanguage(fromClass);

  const dataLang = element.getAttribute('data-language');
  if (dataLang) return normalizeLanguage(dataLang);

  const pre = element.closest('pre');
  if (pre) {
    const preClass = pre.className.match(/language-([\w#+-]+)/i)?.[1];
    if (preClass) return normalizeLanguage(preClass);
    const preDataLang = pre.getAttribute('data-language');
    if (preDataLang) return normalizeLanguage(preDataLang);
  }

  return 'plaintext';
}

function highlightBlock(element: HTMLElement) {
  const language = resolveLanguage(element);
  const source = element.textContent ?? '';

  if (!source.trim()) {
    element.classList.add('hljs');
    return;
  }

  element.className = `hljs language-${language}`;

  try {
    if (language !== 'plaintext' && hljs.getLanguage(language)) {
      element.innerHTML = hljs.highlight(source, { language, ignoreIllegals: true }).value;
    } else {
      element.innerHTML = hljs.highlightAuto(source).value;
    }
  } catch {
    element.textContent = source;
    element.classList.add('hljs');
  }

  element.dataset.highlighted = 'yes';
}

function wrapCodeBlocks(root: ParentNode) {
  root.querySelectorAll('pre').forEach((pre) => {
    if (!pre.querySelector('code')) {
      const code = document.createElement('code');
      code.textContent = pre.textContent;
      pre.textContent = '';
      pre.appendChild(code);
    }

    if (pre.closest('.rich-code-block')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'not-prose rich-code-block';
    pre.parentNode?.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);
  });
}

export function highlightCodeBlocks(root: ParentNode) {
  registerHighlightLanguages();
  wrapCodeBlocks(root);
  root.querySelectorAll('pre code').forEach((block) => {
    const element = block as HTMLElement;
    if (element.dataset.highlighted === 'yes') return;
    highlightBlock(element);
  });
}

export function highlightRichHtml(html: string): string {
  if (!html || typeof window === 'undefined') return html;

  const container = document.createElement('div');
  container.innerHTML = html;
  highlightCodeBlocks(container);
  return container.innerHTML;
}
