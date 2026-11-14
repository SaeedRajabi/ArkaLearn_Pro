'use client';

import { cn } from '@/lib/utils';
import { useNavigationLoading } from '@/contexts/navigation-loading-context';
import { WaveDotsLoader } from './wave-dots-loader';

export function MainContentLoader() {
  const { phase } = useNavigationLoading();
  const visible = phase !== 'idle';

  if (!visible) {
    return null;
  }

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-200',
        'bg-background/10 opacity-100'
      )}
      aria-hidden={false}
      aria-live="polite"
      aria-busy={phase === 'loading'}
    >
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/40 bg-background/70 px-8 py-6 shadow-sm backdrop-blur-sm">
        <WaveDotsLoader phase={phase === 'complete' ? 'complete' : 'loading'} />
      </div>
    </div>
  );
}
