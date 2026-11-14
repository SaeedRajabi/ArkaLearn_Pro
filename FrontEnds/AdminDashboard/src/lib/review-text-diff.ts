export type DiffSegment = {
  type: 'same' | 'add' | 'remove';
  text: string;
};

function tokenize(text: string): string[] {
  if (!text.trim()) return [];
  return text.split(/(\s+)/).filter((part) => part.length > 0);
}

export function buildWordDiff(previousText: string | null | undefined, currentText: string | null | undefined): DiffSegment[] {
  const oldTokens = tokenize(previousText ?? '');
  const newTokens = tokenize(currentText ?? '');
  const rows = oldTokens.length + 1;
  const cols = newTokens.length + 1;
  const lcs: number[][] = Array.from({ length: rows }, () => Array<number>(cols).fill(0));

  for (let i = oldTokens.length - 1; i >= 0; i -= 1) {
    for (let j = newTokens.length - 1; j >= 0; j -= 1) {
      if (oldTokens[i] === newTokens[j]) lcs[i][j] = lcs[i + 1][j + 1] + 1;
      else lcs[i][j] = Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const segments: DiffSegment[] = [];
  let i = 0;
  let j = 0;

  const push = (type: DiffSegment['type'], text: string) => {
    if (!text) return;
    const last = segments[segments.length - 1];
    if (last && last.type === type) last.text += text;
    else segments.push({ type, text });
  };

  while (i < oldTokens.length && j < newTokens.length) {
    if (oldTokens[i] === newTokens[j]) {
      push('same', oldTokens[i]);
      i += 1;
      j += 1;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      push('remove', oldTokens[i]);
      i += 1;
    } else {
      push('add', newTokens[j]);
      j += 1;
    }
  }

  while (i < oldTokens.length) {
    push('remove', oldTokens[i]);
    i += 1;
  }

  while (j < newTokens.length) {
    push('add', newTokens[j]);
    j += 1;
  }

  return segments;
}
