'use client';

import * as React from 'react';
import { Check, Code2, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const LANGUAGE_LABELS: Record<string, string> = {
  csharp: 'C#',
  cs: 'C#',
  javascript: 'JavaScript',
  js: 'JavaScript',
  typescript: 'TypeScript',
  ts: 'TypeScript',
  python: 'Python',
  java: 'Java',
  cpp: 'C++',
  c: 'C',
  sql: 'SQL',
  html: 'HTML',
  css: 'CSS',
};

type Props = {
  code: string;
  language?: string | null;
  className?: string;
  copyLabel?: string;
  copiedLabel?: string;
};

function highlightLine(line: string): React.ReactNode {
  const keyword =
    /\b(for|if|else|while|return|int|void|string|bool|var|let|const|function|class|public|private|static|async|await|new|using|Console)\b/g;
  const parts = line.split(keyword);
  if (parts.length === 1) return line;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const re = new RegExp(keyword);
  while ((match = re.exec(line)) !== null) {
    if (match.index > lastIndex) nodes.push(line.slice(lastIndex, match.index));
    nodes.push(
      <span key={`${match.index}-${match[0]}`} className="text-[#c678dd]">
        {match[0]}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < line.length) nodes.push(line.slice(lastIndex));
  return nodes;
}

export function ExamQuestionCodeBlock({
  code,
  language,
  className,
  copyLabel = 'Copy',
  copiedLabel = 'Copied',
}: Props) {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);
  const langKey = (language ?? 'code').toLowerCase();
  const langLabel = LANGUAGE_LABELS[langKey] ?? language ?? 'Code';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast({ title: copiedLabel });
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast({ variant: 'destructive', title: copyLabel });
    }
  };

  return (
    <div className={cn('relative overflow-hidden rounded-lg border bg-muted/50', className)}>
      <div className="flex items-center justify-between border-b bg-muted/80 px-3 py-1.5 text-xs text-muted-foreground">
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors hover:bg-background/80 hover:text-foreground"
          aria-label={copyLabel}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
        <span className="inline-flex items-center gap-1 font-medium">
          <Code2 className="h-3.5 w-3.5" />
          {langLabel}
        </span>
      </div>
      <pre className="overflow-x-auto p-3 text-start font-mono text-[13px] leading-relaxed text-foreground">
        <code>
          {code.split('\n').map((line, idx) => (
            <div key={idx}>{highlightLine(line) || '\u00A0'}</div>
          ))}
        </code>
      </pre>
    </div>
  );
}

export const EXAM_CODE_LANGUAGES = [
  { value: 'csharp', labelFa: 'C#', labelEn: 'C#' },
  { value: 'javascript', labelFa: 'JavaScript', labelEn: 'JavaScript' },
  { value: 'typescript', labelFa: 'TypeScript', labelEn: 'TypeScript' },
  { value: 'python', labelFa: 'Python', labelEn: 'Python' },
  { value: 'java', labelFa: 'Java', labelEn: 'Java' },
  { value: 'cpp', labelFa: 'C++', labelEn: 'C++' },
  { value: 'sql', labelFa: 'SQL', labelEn: 'SQL' },
];
